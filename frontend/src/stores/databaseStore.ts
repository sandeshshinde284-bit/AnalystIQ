import { defineStore } from "pinia";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebase/config"; // ← Import from config
import { useAuthStore } from "./authStore";

export const useDatabaseStore = defineStore("database", {
  state: () => ({
    currentAnalysisId: null as string | null,
    userAnalyses: [] as any[],
    isLoading: false,
    dbError: null as string | null,
  }),

  actions: {
    async saveAnalysisToFirestore(
      analysisData: any,
      fileNames: string[],
      sector: string
    ) {
      const authStore = useAuthStore();
      if (!authStore.user) {
        throw new Error("User not authenticated");
      }

      this.isLoading = true;
      this.dbError = null;

      try {
        const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const analysisDoc = {
          userId: authStore.user.uid,
          analysisId: analysisId,
          companyName: analysisData.startupName,
          industry: analysisData.industry,
          status: "completed",
          uploadedAt: Timestamp.now(),

          agents: {
            agent1: {
              status: "completed",
              timestamp: Timestamp.now(),
              extracted: analysisData,
            },
            agent2: {
              status: "completed",
              timestamp: Timestamp.now(),
              mapped: analysisData,
            },
            agent3: {
              status: "completed",
              timestamp: Timestamp.now(),
              questions: analysisData.questions_json,
              callPrepQuestions: analysisData.call_prep_questions,
            },
            agent4: {
              status: "completed",
              timestamp: Timestamp.now(),
              memoPdfBase64: analysisData.memo_pdf_base64,
            },
          },

          founderResponse: {
            status: "not_sent",
            answers: [],
            reanalysisStatus: "pending",
          },

          metadata: {
            fileNames: fileNames,
            sector: sector,
            processingTimeMs: Date.now(),
          },
        };

        await setDoc(doc(db, "analyses", analysisId), analysisDoc);

        this.currentAnalysisId = analysisId;
        console.log("✅ Analysis saved to Firestore:", analysisId);

        return analysisId;
      } catch (error: any) {
        this.dbError = error.message;
        console.error("❌ Failed to save analysis:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async loadAnalysisById(analysisId: string) {
      this.isLoading = true;
      this.dbError = null;

      try {
        const docRef = doc(db, "analyses", analysisId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          throw new Error("Analysis not found");
        }

        console.log("✅ Analysis loaded:", analysisId);
        return docSnap.data();
      } catch (error: any) {
        this.dbError = error.message;
        console.error("❌ Failed to load analysis:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async loadUserAnalyses() {
      const authStore = useAuthStore();
      if (!authStore.user) {
        throw new Error("User not authenticated");
      }

      this.isLoading = true;
      this.dbError = null;

      try {
        const q = query(
          collection(db, "analyses"),
          where("userId", "==", authStore.user.uid)
        );

        const querySnapshot = await getDocs(q);
        this.userAnalyses = [];

        querySnapshot.forEach((doc) => {
          this.userAnalyses.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        console.log("✅ Loaded", this.userAnalyses.length, "analyses");
        return this.userAnalyses;
      } catch (error: any) {
        this.dbError = error.message;
        console.error("❌ Failed to load analyses:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async updateFounderResponse(analysisId: string, answers: any[]) {
      this.isLoading = true;
      this.dbError = null;

      try {
        await updateDoc(doc(db, "analyses", analysisId), {
          "founderResponse.status": "answered",
          "founderResponse.answeredAt": Timestamp.now(),
          "founderResponse.answers": answers,
          "founderResponse.reanalysisStatus": "pending",
        });

        console.log("✅ Founder response saved");
      } catch (error: any) {
        this.dbError = error.message;
        console.error("❌ Failed to update response:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
