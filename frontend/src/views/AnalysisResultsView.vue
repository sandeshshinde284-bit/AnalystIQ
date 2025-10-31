<!-- AnalysisResultsView.vue -->

<template>
  <div v-if="analysisData" id="analysis-results-container" class="page-wrapper">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="header-main">
          <h1>Investment Analysis: {{ analysisData.startupName }}</h1>
          <div class="sector-info">
            <span v-if="analysisData.sector" class="sector-badge">
              <i class="ri-briefcase-line"></i>
              {{ getSectorLabel(analysisData.sector) }}
            </span>
            <span v-if="analysisData.industry" class="industry-badge">
              <i class="ri-building-line"></i>
              {{ analysisData.industry }}
            </span>
          </div>
          <div class="analysis-badges">
            <div
              class="analysis-badge confidence"
              :class="getConfidenceClass()"
            >
              <i class="ri-shield-check-line"></i>
              {{ getConfidenceLevel() }} Investment Confidence
            </div>
          </div>
        </div>
        <button class="export-btn primary" @click="handlePrintReport">
          <i class="ri-download-line"></i>
          Print & Download as PDF
        </button>
        <button
          class="export-btn primary"
          @click="handleExportMemo"
          style="margin-left: 12px"
        >
          <i class="ri-file-pdf-line"></i>
          Export Memo
        </button>
      </div>
      <ValidationSummary v-if="showValidationSummary" />
      <!-- Recommendation Box -->
      <div class="recommendation-box">
        <div class="recommendation-header">
          <span class="label">INVESTMENT RECOMMENDATION</span>
          <span class="badge complete">Analysis Complete</span>
        </div>
        <h2 class="recommendation-text">
          {{ analysisData.recommendation.text }}
        </h2>
        <div class="recommendation-score">
          <span class="score-label">Investment Score:</span>
          <div class="score-bar">
            <div
              class="score-fill"
              :style="{ width: analysisData.recommendation.score + '%' }"
            ></div>
          </div>
          <span class="score-value"
            >{{ analysisData.recommendation.score }}/100</span
          >
        </div>
        <p class="recommendation-justification">
          {{ analysisData.recommendation.justification }}
        </p>
      </div>

      <!-- Customize Weights Button -->
      <button @click="showWeightageModal = true" class="customize-weights-btn">
        ⚙️ Customize Weights
      </button>

      <!-- Tabs Navigation -->
      <div class="tabs-navigation">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          <i :class="tab.icon"></i>
          {{ tab.name }}
          <span
            v-if="tab.id === 'risk' && analysisData.riskAssessment"
            class="tab-count"
          >
            {{ analysisData.riskAssessment.length }}
          </span>
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- EXECUTIVE SUMMARY TAB -->
        <div data-tab-pane v-show="activeTab === 'summary'" class="tab-pane">
          <div class="summary-section">
            <h3>Business Overview</h3>
            <p>{{ analysisData.summaryContent.businessOverview }}</p>
          </div>

          <div class="summary-section">
            <h3>Team & Experience</h3>
            <p>{{ analysisData.summaryContent.teamExperience }}</p>
          </div>

          <div class="summary-section">
            <h3>Product & Technology</h3>
            <p>{{ analysisData.summaryContent.productTech }}</p>
          </div>
          <!-- 🆕 ENHANCED PUBLIC DATA SECTION -->
          <div class="summary-section public-data-section" v-if="hasPublicData">
            <h3>🌐 Public Data & Market Intelligence</h3>
            <p class="section-intro">
              Real-time data gathered from web sources to validate claims and
              provide market context
            </p>

            <!-- GitHub Profiles -->
            <div v-if="hasGitHubData" class="public-data-group">
              <PublicDataCard
                title="GitHub Developer Activity"
                subtitle="Source code repositories and contributions"
                icon="ri-github-fill"
                iconColor="#6366f1"
                iconBg="rgba(99, 102, 241, 0.1)"
                cardType="github"
                badge="Verified"
                badgeType="verified"
              >
                <div class="github-profiles-grid">
                  <div
                    v-for="(profile, idx) in publicData.github_profiles"
                    :key="idx"
                    class="github-profile-card"
                  >
                    <a
                      v-if="profile.url"
                      :href="profile.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="profile-link"
                    >
                      <div class="profile-header">
                        <div class="profile-avatar">
                          <i class="ri-user-line"></i>
                        </div>
                        <div class="profile-info">
                          <h5>{{ profile.name || "Developer" }}</h5>
                          <span class="username"
                            >@{{ profile.username || "unknown" }}</span
                          >
                        </div>
                      </div>

                      <div v-if="profile.stats" class="profile-stats">
                        <div v-if="profile.stats.repos" class="stat-item">
                          <i class="ri-git-repository-line"></i>
                          <span>{{ profile.stats.repos }} repos</span>
                        </div>
                        <div v-if="profile.stats.followers" class="stat-item">
                          <i class="ri-user-follow-line"></i>
                          <span>{{ profile.stats.followers }} followers</span>
                        </div>
                        <div
                          v-if="profile.stats.contributions"
                          class="stat-item"
                        >
                          <i class="ri-git-commit-line"></i>
                          <span
                            >{{
                              profile.stats.contributions
                            }}
                            contributions</span
                          >
                        </div>
                      </div>

                      <div v-if="profile.bio" class="profile-bio">
                        {{ profile.bio }}
                      </div>
                    </a>
                  </div>
                </div>
              </PublicDataCard>
            </div>

            <!-- News & Press -->
            <div v-if="hasNewsData" class="public-data-group">
              <PublicDataCard
                title="News & Press Coverage"
                :subtitle="`${publicData.news.length} recent articles found`"
                icon="ri-newspaper-fill"
                iconColor="#3b82f6"
                iconBg="rgba(59, 130, 246, 0.1)"
                cardType="news"
                badge="Recent"
                badgeType="new"
              >
                <div class="news-grid">
                  <NewsArticleCard
                    v-for="(article, idx) in publicData.news.slice(0, 6)"
                    :key="idx"
                    :article="article"
                  />
                </div>
              </PublicDataCard>
            </div>

            <!-- Company Information -->
            <div v-if="hasCompanyInfo" class="public-data-group">
              <PublicDataCard
                title="Company Information"
                subtitle="Verified company details"
                icon="ri-building-fill"
                iconColor="#00d4ff"
                iconBg="rgba(0, 212, 255, 0.1)"
                cardType="company"
              >
                <div class="company-info-grid">
                  <div v-if="publicData.company_info.website" class="info-item">
                    <div class="info-label">
                      <i class="ri-global-line"></i>
                      Website
                    </div>
                    <a
                      :href="publicData.company_info.website"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="info-value link"
                    >
                      {{ publicData.company_info.website }}
                      <i class="ri-external-link-line"></i>
                    </a>
                  </div>

                  <div v-if="publicData.company_info.founded" class="info-item">
                    <div class="info-label">
                      <i class="ri-calendar-line"></i>
                      Founded
                    </div>
                    <div class="info-value">
                      {{ publicData.company_info.founded }}
                    </div>
                  </div>

                  <div
                    v-if="publicData.company_info.location"
                    class="info-item"
                  >
                    <div class="info-label">
                      <i class="ri-map-pin-line"></i>
                      Location
                    </div>
                    <div class="info-value">
                      {{ publicData.company_info.location }}
                    </div>
                  </div>

                  <div
                    v-if="publicData.company_info.employees"
                    class="info-item"
                  >
                    <div class="info-label">
                      <i class="ri-team-line"></i>
                      Team Size
                    </div>
                    <div class="info-value">
                      {{ publicData.company_info.employees }}
                    </div>
                  </div>

                  <div
                    v-if="publicData.company_info.description"
                    class="info-item full-width"
                  >
                    <div class="info-label">
                      <i class="ri-information-line"></i>
                      Description
                    </div>
                    <div class="info-value description">
                      {{ publicData.company_info.description }}
                    </div>
                  </div>
                </div>
              </PublicDataCard>
            </div>

            <!-- Funding Profile -->
            <div v-if="hasFundingData" class="public-data-group">
              <PublicDataCard
                title="Funding & Investment Profile"
                subtitle="Market conditions and funding trends"
                icon="ri-funds-fill"
                iconColor="#22c55e"
                iconBg="rgba(34, 197, 94, 0.1)"
                cardType="funding"
              >
                <div class="funding-profile-grid">
                  <div
                    v-if="publicData.funding_profile.stage"
                    class="funding-item"
                  >
                    <div class="funding-label">Funding Stage</div>
                    <div class="funding-value highlight">
                      {{ publicData.funding_profile.stage }}
                    </div>
                  </div>

                  <div
                    v-if="publicData.funding_profile.typical_check_size"
                    class="funding-item"
                  >
                    <div class="funding-label">Typical Check Size</div>
                    <div class="funding-value">
                      {{ publicData.funding_profile.typical_check_size }}
                    </div>
                  </div>

                  <div
                    v-if="publicData.funding_profile.market_conditions"
                    class="funding-item"
                  >
                    <div class="funding-label">Market Conditions</div>
                    <div class="funding-value">
                      {{ publicData.funding_profile.market_conditions }}
                    </div>
                  </div>

                  <div
                    v-if="publicData.funding_profile.investor_appetite"
                    class="funding-item"
                  >
                    <div class="funding-label">Investor Appetite</div>
                    <div class="funding-value">
                      {{ publicData.funding_profile.investor_appetite }}
                    </div>
                  </div>
                </div>
              </PublicDataCard>
            </div>

            <!-- Social Proof -->
            <div v-if="hasSocialProof" class="public-data-group">
              <PublicDataCard
                title="Social Proof & Recognition"
                subtitle="Awards, partnerships, and achievements"
                icon="ri-award-fill"
                iconColor="#a855f7"
                iconBg="rgba(168, 85, 247, 0.1)"
                cardType="social"
              >
                <div class="social-proof-list">
                  <div v-if="publicData.social_proof.awards" class="proof-item">
                    <div class="proof-icon">
                      <i class="ri-trophy-line"></i>
                    </div>
                    <div class="proof-content">
                      <strong>Awards & Recognition</strong>
                      <p>{{ publicData.social_proof.awards }}</p>
                    </div>
                  </div>

                  <div
                    v-if="publicData.social_proof.partnerships"
                    class="proof-item"
                  >
                    <div class="proof-icon">
                      <i class="ri-links-line"></i>
                    </div>
                    <div class="proof-content">
                      <strong>Strategic Partnerships</strong>
                      <p>{{ publicData.social_proof.partnerships }}</p>
                    </div>
                  </div>

                  <div
                    v-if="publicData.social_proof.media_mentions"
                    class="proof-item"
                  >
                    <div class="proof-icon">
                      <i class="ri-newspaper-line"></i>
                    </div>
                    <div class="proof-content">
                      <strong>Media Coverage</strong>
                      <p>{{ publicData.social_proof.media_mentions }}</p>
                    </div>
                  </div>
                </div>
              </PublicDataCard>
            </div>

            <!-- Market Intelligence -->
            <div v-if="hasMarketData" class="public-data-group">
              <PublicDataCard
                title="Market Intelligence"
                subtitle="Industry trends and market momentum"
                icon="ri-line-chart-fill"
                iconColor="#f59e0b"
                iconBg="rgba(245, 158, 11, 0.1)"
                cardType="market"
                badge="Trending"
                badgeType="trending"
              >
                <div class="market-data-list">
                  <div
                    v-if="publicData.market_data.sector_momentum"
                    class="market-item"
                  >
                    <div class="market-label">
                      <i class="ri-rocket-line"></i>
                      Sector Momentum
                    </div>
                    <div class="market-value">
                      {{ publicData.market_data.sector_momentum }}
                    </div>
                  </div>

                  <div
                    v-if="publicData.market_data.market_trends"
                    class="market-item"
                  >
                    <div class="market-label">
                      <i class="ri-stock-line"></i>
                      Current Trends
                    </div>
                    <div class="market-value">
                      {{ publicData.market_data.market_trends }}
                    </div>
                  </div>

                  <div
                    v-if="publicData.market_data.competitive_landscape"
                    class="market-item"
                  >
                    <div class="market-label">
                      <i class="ri-focus-3-line"></i>
                      Competitive Landscape
                    </div>
                    <div class="market-value">
                      {{ publicData.market_data.competitive_landscape }}
                    </div>
                  </div>
                </div>
              </PublicDataCard>
            </div>
          </div>

          <!-- Key Metrics with Context -->
          <div class="metrics-section">
            <h3>Key Investment Metrics</h3>
            <div class="metrics-grid">
              <div
                v-for="(metric, index) in analysisData.keyMetrics"
                :key="index"
                class="metric-card"
              >
                <div class="metric-header">
                  <h4>{{ metric.label }}</h4>
                  <span
                    class="confidence-badge"
                    :class="metric.source.confidence"
                  >
                    {{ metric.source.confidence }}
                  </span>
                </div>
                <div class="metric-value">{{ metric.value }}</div>
                <div class="metric-context">
                  {{ getMetricContext(metric.label) }}
                </div>
                <button class="verify-btn" @click="openSourceModal(metric)">
                  <i class="ri-search-line"></i>
                  Verify Source
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- INVESTMENT RISKS TAB -->
        <div data-tab-pane v-show="activeTab === 'risk'" class="tab-pane">
          <h3>Risk Assessment</h3>
          <div
            v-if="
              analysisData.riskAssessment &&
              analysisData.riskAssessment.length > 0
            "
            class="risks-grid"
          >
            <div
              v-for="(risk, index) in analysisData.riskAssessment"
              :key="index"
              class="risk-card"
              :class="`risk-${risk.level}`"
            >
              <div class="risk-header">
                <span class="risk-type">{{ formatRiskType(risk.type) }}</span>
                <span class="risk-level" :class="risk.level">{{
                  risk.level.toUpperCase()
                }}</span>
              </div>
              <h4>{{ risk.title }}</h4>
              <p class="risk-description">{{ risk.description }}</p>
              <div class="risk-details">
                <div class="detail-item">
                  <strong>Mitigation:</strong>
                  <p>{{ risk.mitigation }}</p>
                </div>
                <div class="detail-item">
                  <strong>Impact:</strong>
                  <p>{{ risk.impact }}</p>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>No risk assessment data available</p>
          </div>
        </div>

        <!-- MARKET ANALYSIS TAB -->
        <div data-tab-pane v-show="activeTab === 'market'" class="tab-pane">
          <h3>Market Analysis</h3>

          <!-- Market Sizing -->
          <div v-if="analysisData.marketOpportunity" class="market-sizing">
            <h4>Market Sizing</h4>
            <div class="sizing-grid">
              <div class="sizing-card">
                <div class="sizing-label">TAM</div>
                <div class="sizing-value">
                  {{ analysisData.marketOpportunity.TAM || "Not specified" }}
                </div>
                <div class="sizing-desc">Total Addressable Market</div>
              </div>
              <div class="sizing-card">
                <div class="sizing-label">SAM</div>
                <div class="sizing-value">
                  {{ analysisData.marketOpportunity.SAM || "Not specified" }}
                </div>
                <div class="sizing-desc">Serviceable Addressable Market</div>
              </div>
              <div class="sizing-card">
                <div class="sizing-label">SOM</div>
                <div class="sizing-value">
                  {{ analysisData.marketOpportunity.SOM || "Not specified" }}
                </div>
                <div class="sizing-desc">Serviceable Obtainable Market</div>
              </div>
              <div class="sizing-card">
                <div class="sizing-label">Growth Rate</div>
                <div class="sizing-value">
                  {{
                    analysisData.marketOpportunity.growthRate || "Not specified"
                  }}
                </div>
                <div class="sizing-desc">CAGR / Market Growth</div>
              </div>
            </div>
          </div>

          <!-- Competitive Analysis -->
          <div
            v-if="
              analysisData.competitiveAnalysis &&
              analysisData.competitiveAnalysis.length > 0
            "
            class="competitive-section"
          >
            <h4>Competitive Landscape</h4>
            <div class="competitors-grid">
              <div
                v-for="(comp, index) in analysisData.competitiveAnalysis"
                :key="index"
                class="competitor-card"
              >
                <h5>{{ comp.competitor }}</h5>
                <div class="comp-detail">
                  <strong>Differentiators:</strong>
                  <p>{{ comp.differentiators }}</p>
                </div>
                <div class="comp-detail">
                  <strong>Market Position:</strong>
                  <p>{{ comp.marketShare || "Not specified" }}</p>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>No competitive analysis data available</p>
          </div>
        </div>

        <!-- FINANCIAL ANALYSIS TAB -->
        <div data-tab-pane v-show="activeTab === 'financial'" class="tab-pane">
          <h3>Financial Analysis</h3>

          <!-- Add this section BEFORE the "limited financial data" message -->
          <MarketBenchmarkChart :startup-name="analysisData.startupName" />

          <!-- Financial Projections -->
          <div
            v-if="
              analysisData.financialProjections &&
              analysisData.financialProjections.length > 0
            "
            class="financial-section"
          >
            <h4>Revenue Projections</h4>
            <div class="projections-table">
              <table>
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Revenue</th>
                    <th>Expenses</th>
                    <th>Margins</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(proj, index) in analysisData.financialProjections"
                    :key="index"
                  >
                    <td>{{ proj.year }}</td>
                    <td>{{ proj.revenue || "N/A" }}</td>
                    <td>{{ proj.expenses || "N/A" }}</td>
                    <td>{{ proj.margins || "N/A" }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Valuation Insights -->
          <div
            v-if="
              analysisData.valuationInsights &&
              Object.keys(analysisData.valuationInsights).length > 0
            "
            class="valuation-section"
          >
            <h4>Valuation Insights</h4>
            <div class="valuation-grid">
              <div
                v-for="(value, key) in analysisData.valuationInsights"
                :key="key"
                class="valuation-card"
              >
                <strong>{{ formatLabel(key) }}</strong>
                <p>{{ value || "Not specified" }}</p>
              </div>
            </div>
          </div>

          <!-- Investment Terms -->
          <div
            v-if="
              analysisData.investmentTerms &&
              Object.keys(analysisData.investmentTerms).length > 0
            "
            class="terms-section"
          >
            <h4>Investment Terms</h4>
            <div class="terms-grid">
              <div
                v-for="(value, key) in analysisData.investmentTerms"
                :key="key"
                class="term-card"
              >
                <strong>{{ formatLabel(key) }}</strong>
                <p>{{ value || "Not specified" }}</p>
              </div>
            </div>
          </div>

          <div
            v-if="
              !analysisData.financialProjections &&
              !analysisData.valuationInsights &&
              !analysisData.investmentTerms
            "
            class="empty-state"
          >
            <p>Limited financial data available in the provided documents</p>
          </div>
        </div>

        <!-- TRACTION TAB -->
        <div data-tab-pane v-show="activeTab === 'traction'" class="tab-pane">
          <h3>🚀 Traction & Growth Metrics</h3>

          <div v-if="hasTractionData" class="traction-section-enhanced">
            <!-- Primary Metrics Grid -->
            <div class="traction-grid">
              <TractionMetricCard
                v-if="analysisData.traction.customers"
                title="Customer Base"
                :value="analysisData.traction.customers"
                icon="ri-team-fill"
                iconColor="#22c55e"
                iconBg="rgba(34, 197, 94, 0.1)"
                metricType="customers"
                badge="Active"
                :description="
                  getCustomerInsight(analysisData.traction.customers)
                "
              />

              <TractionMetricCard
                v-if="analysisData.traction.revenue"
                title="Revenue"
                :value="analysisData.traction.revenue"
                icon="ri-money-dollar-circle-fill"
                iconColor="#00d4ff"
                iconBg="rgba(0, 212, 255, 0.1)"
                metricType="revenue"
                :growth="extractGrowthRate(analysisData.traction.revenue)"
                :description="getRevenueInsight(analysisData.traction.revenue)"
              />

              <TractionMetricCard
                v-if="analysisData.traction.users"
                title="User Base"
                :value="analysisData.traction.users"
                icon="ri-user-star-fill"
                iconColor="#a855f7"
                iconBg="rgba(168, 85, 247, 0.1)"
                metricType="users"
                :growth="extractGrowthRate(analysisData.traction.users)"
                :description="getUserInsight(analysisData.traction.users)"
              />

              <TractionMetricCard
                v-if="analysisData.traction.growth_rate"
                title="Growth Rate"
                :value="analysisData.traction.growth_rate"
                icon="ri-line-chart-fill"
                iconColor="#f59e0b"
                iconBg="rgba(245, 158, 11, 0.1)"
                metricType="growth"
                badge="Trending"
              />
            </div>

            <!-- Secondary Metrics -->
            <div v-if="hasSecondaryTraction" class="secondary-traction">
              <h4>
                <i class="ri-focus-3-line"></i> Additional Traction Signals
              </h4>

              <div class="secondary-grid">
                <TractionMetricCard
                  v-if="analysisData.traction.partnerships"
                  title="Partnerships & Integrations"
                  :value="analysisData.traction.partnerships"
                  icon="ri-links-fill"
                  iconColor="#3b82f6"
                  iconBg="rgba(59, 130, 246, 0.1)"
                  metricType="partnerships"
                />

                <TractionMetricCard
                  v-if="analysisData.traction.awards"
                  title="Awards & Recognition"
                  :value="analysisData.traction.awards"
                  icon="ri-award-fill"
                  iconColor="#eab308"
                  iconBg="rgba(234, 179, 8, 0.1)"
                  metricType="awards"
                />

                <TractionMetricCard
                  v-if="analysisData.traction.media"
                  title="Press & Media Coverage"
                  :value="analysisData.traction.media"
                  icon="ri-newspaper-fill"
                  iconColor="#06b6d4"
                  iconBg="rgba(6, 182, 212, 0.1)"
                  metricType="awards"
                />
              </div>
            </div>

            <!-- Traction Summary -->
            <div class="traction-summary-card">
              <h4><i class="ri-lightbulb-line"></i> Traction Analysis</h4>
              <p>{{ getTractionSummary() }}</p>
            </div>
          </div>

          <div v-else class="empty-state">
            <i class="ri-database-2-line"></i>
            <p>No traction data found in uploaded documents</p>
            <span class="hint"
              >Upload documents that include customer counts, revenue figures,
              user metrics, or growth data</span
            >
          </div>
        </div>

        <!-- CALL PREPARATION TAB - PROFESSIONAL DESIGN -->
        <div data-tab-pane v-show="activeTab === 'call-prep'" class="tab-pane">
          <div class="call-prep-header">
            <div>
              <h3>🎯 Pre-Call Founder Questionnaire</h3>
              <p class="call-prep-subtitle">
                Context-aware questions generated from your analysis to help the
                founder prepare
              </p>
            </div>
          </div>

          <div class="call-prep-container">
            <!-- Questions Display -->
            <div
              v-if="analysisData.call_prep_questions"
              class="call-prep-content"
            >
              <!-- Category Stats Bar -->
              <!-- <div class="category-stats-bar">
                <div
                  v-for="cat in [
                    'revenue',
                    'market',
                    'team',
                    'product',
                    'growth',
                  ]"
                  :key="cat"
                  class="cat-stat"
                  :style="{ borderLeftColor: getCategoryColor(cat) }"
                >
                  <i :class="getCategoryIcon(cat)"></i>
                  <span class="cat-name">{{
                    cat.charAt(0).toUpperCase() + cat.slice(1)
                  }}</span>
                  <span class="cat-count">
                    {{
                      parsedCallPrepQuestions.filter((q) => q.category === cat)
                        .length
                    }}
                  </span>
                </div>
              </div> -->

              <!-- Questions Grid -->
              <div class="questions-grid-pro">
                <div
                  v-for="(q, idx) in parsedCallPrepQuestions"
                  :key="idx"
                  class="question-card-pro"
                  :style="{
                    borderLeftColor: getCategoryColor(q.category),
                    '--accent-color': getCategoryColor(q.category),
                  }"
                >
                  <!-- Question Header -->
                  <div class="q-header-pro">
                    <div class="q-number-badge">{{ q.number }}</div>
                    <div class="q-header-info">
                      <div class="q-meta">
                        <!-- <span
                          class="q-category-badge"
                          :style="{
                            backgroundColor:
                              getCategoryColor(q.category) + '15',
                            color: getCategoryColor(q.category),
                            borderColor: getCategoryColor(q.category) + '30',
                          }"
                        >
                          <i :class="getCategoryIcon(q.category)"></i>
                          {{ extractCategoryLabel(q.title) }}
                        </span> -->
                        <span class="q-body-pro"
                          >{{ q.question }}
                          <span class="q-difficulty">
                            {{ getDifficultyLevel(q.question) }}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Question Title (from brackets) -->
                  <!-- <h4 class="q-title-pro">
                    {{ extractCategoryLabel(q.title) }}
                  </h4> -->

                  <!-- Full Question Text -->
                  <!-- <p class="q-body-pro">{{ q.question }}</p> -->

                  <!-- Context Insight -->
                  <div class="q-insight">
                    <i class="ri-lightbulb-flash-line"></i>
                    <span>{{ getQuestionContext(q.title, q.category) }}</span>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="call-prep-actions-pro">
                <button
                  @click="downloadQuestions"
                  class="action-btn-pro primary"
                >
                  <i class="ri-download-cloud-line"></i>
                  <span>Download Questions</span>
                  <span class="btn-meta">as .txt file</span>
                </button>
                <button
                  @click="copyQuestionsToClipboard"
                  class="action-btn-pro secondary"
                >
                  <i class="ri-file-copy-line"></i>
                  <span>Copy to Clipboard</span>
                  <span class="btn-meta">all questions</span>
                </button>
                <button @click="emailQuestions" class="action-btn-pro tertiary">
                  <i class="ri-mail-send-line"></i>
                  <span>Email to Founder</span>
                  <span class="btn-meta">via mailto</span>
                </button>
              </div>

              <!-- Footer Info -->
              <div class="call-prep-footer">
                <div class="footer-stat">
                  <i class="ri-file-document-line"></i>
                  <span
                    ><strong>{{ parsedCallPrepQuestions.length }}</strong>
                    questions generated</span
                  >
                </div>
                <div class="footer-stat">
                  <i class="ri-time-line"></i>
                  <span>Estimated prep time: <strong>15-20 mins</strong></span>
                </div>
                <div class="footer-stat">
                  <i class="ri-lightbulb-line"></i>
                  <span
                    ><strong>Pro tip:</strong> Share 24 hours before call</span
                  >
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="call-prep-empty">
              <div class="empty-icon">
                <i class="ri-inbox-line"></i>
              </div>
              <h4>No Questions Generated Yet</h4>
              <p>Questions will be created based on your startup analysis</p>
            </div>
          </div>
        </div>

        <!-- BENCHMARKING TAB -->
        <div
          data-tab-pane
          v-show="activeTab === 'benchmarking'"
          class="tab-pane"
        >
          <h3>📊 Industry Benchmark Comparison</h3>
          <p class="tab-description">
            How this startup compares to sector benchmarks at their stage
          </p>

          <div class="benchmarking-section">
            <!-- Benchmark Display -->
            <div v-if="analysisData.benchmarking" class="benchmarking-display">
              <!-- Overview Summary -->
              <div class="benchmark-overview">
                <div class="overview-card">
                  <div class="overview-label">Percentile Rank</div>
                  <div class="overview-value">72nd</div>
                  <p class="overview-desc">
                    Out of Seed-stage B2B SaaS companies
                  </p>
                </div>
                <div class="overview-card">
                  <div class="overview-label">Performance</div>
                  <div class="overview-value">Above Average</div>
                  <p class="overview-desc">Competitive advantages identified</p>
                </div>
                <div class="overview-card">
                  <div class="overview-label">Growth Score</div>
                  <div class="overview-value">8.2/10</div>
                  <p class="overview-desc">Strong momentum vs peers</p>
                </div>
              </div>

              <!-- Key Metrics Comparison -->
              <div class="metrics-comparison">
                <h4>Key Performance Metrics</h4>
                <div class="comparison-grid">
                  <!-- Metric Card 1: Revenue/Employee -->
                  <div class="metric-comparison-card above-average">
                    <div class="metric-header">
                      <span class="metric-name">Revenue per Employee</span>
                      <span class="metric-rating">🟢 Above Average</span>
                    </div>
                    <div class="metric-comparison">
                      <div class="comparison-item">
                        <span class="label">This Startup</span>
                        <span class="value">$750K</span>
                      </div>
                      <div class="comparison-item">
                        <span class="label">Industry Benchmark</span>
                        <span class="value">$500K</span>
                      </div>
                    </div>
                    <div class="metric-bar-container">
                      <div class="bar-background">
                        <div class="bar-benchmark" style="width: 100%"></div>
                        <div class="bar-company" style="width: 150%"></div>
                      </div>
                    </div>
                    <p class="metric-insight">
                      💡 Strong revenue efficiency - indicates effective
                      operations
                    </p>
                  </div>

                  <!-- Metric Card 2: CAC -->
                  <div class="metric-comparison-card above-average">
                    <div class="metric-header">
                      <span class="metric-name">Customer Acquisition Cost</span>
                      <span class="metric-rating">🟢 Above Average</span>
                    </div>
                    <div class="metric-comparison">
                      <div class="comparison-item">
                        <span class="label">This Startup</span>
                        <span class="value">$5,000</span>
                      </div>
                      <div class="comparison-item">
                        <span class="label">Industry Benchmark</span>
                        <span class="value">$8,000</span>
                      </div>
                    </div>
                    <div class="metric-bar-container">
                      <div class="bar-background">
                        <div class="bar-benchmark" style="width: 100%"></div>
                        <div class="bar-company" style="width: 62.5%"></div>
                      </div>
                    </div>
                    <p class="metric-insight">
                      💡 Lower CAC - efficient marketing and sales strategy
                    </p>
                  </div>

                  <!-- Metric Card 3: Team Experience -->
                  <div class="metric-comparison-card below-average">
                    <div class="metric-header">
                      <span class="metric-name">Team Experience</span>
                      <span class="metric-rating">🔴 Below Average</span>
                    </div>
                    <div class="metric-comparison">
                      <div class="comparison-item">
                        <span class="label">This Startup</span>
                        <span class="value">5 years avg</span>
                      </div>
                      <div class="comparison-item">
                        <span class="label">Industry Benchmark</span>
                        <span class="value">8 years avg</span>
                      </div>
                    </div>
                    <div class="metric-bar-container">
                      <div class="bar-background">
                        <div class="bar-benchmark" style="width: 100%"></div>
                        <div class="bar-company" style="width: 62.5%"></div>
                      </div>
                    </div>
                    <p class="metric-insight">
                      ⚠️ Opportunity: Consider hiring experienced advisors or
                      executives
                    </p>
                  </div>
                </div>
              </div>

              <!-- Legend -->
              <div class="benchmark-legend">
                <div class="legend-item">
                  <span class="legend-color" style="background: #22c55e"></span>
                  <span>🟢 Above Average = Competitive advantage</span>
                </div>
                <div class="legend-item">
                  <span class="legend-color" style="background: #eab308"></span>
                  <span>🟡 Average = Expected range</span>
                </div>
                <div class="legend-item">
                  <span class="legend-color" style="background: #ef4444"></span>
                  <span>🔴 Below Average = Improvement area</span>
                </div>
              </div>

              <!-- Improvement Recommendations -->
              <div class="improvement-recommendations">
                <h4>Recommendations for Improvement</h4>
                <div class="recommendations-list">
                  <div class="recommendation-item">
                    <div class="rec-number">1</div>
                    <div class="rec-content">
                      <h5>Strengthen Leadership Team</h5>
                      <p>
                        Hire a VP of Sales or VP of Operations with 10+ years
                        experience in B2B SaaS
                      </p>
                      <span class="rec-impact"
                        >Potential Impact: +15 points on investment score</span
                      >
                    </div>
                  </div>
                  <div class="recommendation-item">
                    <div class="rec-number">2</div>
                    <div class="rec-content">
                      <h5>Maintain Marketing Efficiency</h5>
                      <p>
                        Continue focus on low-CAC channels and customer
                        retention (LTV is strong)
                      </p>
                      <span class="rec-impact"
                        >Potential Impact: Maintain competitive edge</span
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="empty-state">
              <i class="ri-database-2-line"></i>
              <p>No benchmark analysis available</p>
              <span class="hint"
                >Benchmarking will be generated based on your startup sector and
                stage</span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Documents Analyzed -->
      <div class="documents-section">
        <h4>Documents Analyzed</h4>
        <div class="documents-list">
          <div
            v-for="(doc, index) in analysisData.documentsAnalyzed"
            :key="index"
            class="doc-item"
          >
            <i class="ri-file-pdf-line"></i>
            <div class="doc-info">
              <strong>{{ doc.name }}</strong>
              <span class="doc-meta"
                >{{ doc.type }} • {{ doc.pages }} pages</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Source Verification Modal -->
    <div
      v-if="showSourceModal"
      class="modal-overlay"
      @click.self="showSourceModal = false"
    >
      <div class="modal-content">
        <button class="modal-close" @click="showSourceModal = false">
          <i class="ri-close-line"></i>
        </button>

        <div class="modal-header">
          <i class="ri-verified-badge-line"></i>
          <h3>Source Verification</h3>
        </div>

        <div v-if="selectedSource" class="modal-body">
          <div class="source-item">
            <strong>Metric:</strong>
            <p>{{ selectedMetric?.label }}</p>
          </div>

          <div class="source-item">
            <strong>Source Document:</strong>
            <p>{{ selectedSource.location }}</p>
          </div>

          <div class="source-item">
            <strong>Extraction Method:</strong>
            <p>{{ selectedSource.details }}</p>
          </div>

          <div class="source-item">
            <strong>Confidence Level:</strong>
            <div
              class="confidence-indicator"
              :class="selectedSource.confidence"
            >
              {{ selectedSource.confidence.toUpperCase() }} ({{
                getConfidencePercentage(selectedSource.confidence)
              }}%)
            </div>
          </div>

          <div class="source-item">
            <strong>AI Analysis Details:</strong>
            <p>
              Data extracted using
              {{ analysisData.analysisMetadata?.aiModel || "Gemini AI" }} with
              document analysis capabilities
            </p>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn secondary" @click="showSourceModal = false">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- No Data State -->
  <div v-else class="no-data">
    <p>
      No analysis data available. Please upload and analyze a document first.
    </p>
    <router-link to="/app/new-analysis" class="btn primary">
      Start New Analysis
    </router-link>
  </div>

  <!-- Weightage Modal -->
  <div
    v-if="showWeightageModal"
    class="weightage-modal-overlay"
    @click="showWeightageModal = false"
  >
    <div class="weightage-modal-content" @click.stop>
      <button class="modal-close" @click="showWeightageModal = false">✕</button>

      <div class="weightage-customization">
        <h4 style="color: #00d4ff; margin-top: 30px">
          ⚙️ Customize Investment Weights
        </h4>

        <!-- Founder Weight -->
        <div class="weight-slider-group">
          <div class="weight-label">
            <span>Founder Profile</span>
            <span class="weight-value">{{ weights.founder }}%</span>
          </div>
          <input
            v-model.number="weights.founder"
            type="range"
            min="0"
            max="100"
            @change="recalculateScore"
            class="weight-slider"
          />
        </div>

        <!-- Market Weight -->
        <div class="weight-slider-group">
          <div class="weight-label">
            <span>Market Size</span>
            <span class="weight-value">{{ weights.market }}%</span>
          </div>
          <input
            v-model.number="weights.market"
            type="range"
            min="0"
            max="100"
            @change="recalculateScore"
            class="weight-slider"
          />
        </div>

        <!-- Differentiation Weight -->
        <div class="weight-slider-group">
          <div class="weight-label">
            <span>Differentiation</span>
            <span class="weight-value">{{ weights.differentiation }}%</span>
          </div>
          <input
            v-model.number="weights.differentiation"
            type="range"
            min="0"
            max="100"
            @change="recalculateScore"
            class="weight-slider"
          />
        </div>

        <!-- Team Weight -->
        <div class="weight-slider-group">
          <div class="weight-label">
            <span>Team & Traction</span>
            <span class="weight-value">{{ weights.team }}%</span>
          </div>
          <input
            v-model.number="weights.team"
            type="range"
            min="0"
            max="100"
            @change="recalculateScore"
            class="weight-slider"
          />
        </div>

        <!-- Total validation -->
        <div
          class="weight-total"
          :class="{ valid: totalWeight === 100, invalid: totalWeight !== 100 }"
        >
          Total: {{ totalWeight }}%
          <span v-if="totalWeight === 100">✅ Valid</span>
          <span v-else>❌ Must equal 100%</span>
        </div>

        <!-- Updated Score Display -->
        <div class="customized-score-display" v-if="totalWeight === 100">
          <h3 style="color: #00d4ff">
            Customized Score: {{ customizedScore }}/100
          </h3>
        </div>

        <button @click="resetWeights" class="reset-btn">
          Reset to Default (25% each)
        </button>
        <p class="weightage-note">
          💡 Custom weights only affect this view. Export uses default weights.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAnalysisStore } from "@/stores/analysisStore";
import MarketBenchmarkChart from "../components/Molecules/MarketBenchmarkChart.vue";
import { getSectorByValue } from "../config/analysisConfig";
import ValidationSummary from "../components/Molecules/ValidationSummary.vue";
import TractionMetricCard from "../components/Molecules/TractionMetricCard.vue";
import PublicDataCard from "../components/Molecules/PublicDataCard.vue";
import NewsArticleCard from "../components/Molecules/NewsArticleCard.vue";

const router = useRouter();
const analysisStore = useAnalysisStore();
const showWeightageModal = ref(false);

const analysisData = computed(() => analysisStore.analysisResult);

const weights = ref({
  founder: 25,
  market: 25,
  differentiation: 25,
  team: 25,
});

// Store original scores when analysis loads
const originalScores = ref({
  founder: 0,
  market: 0,
  differentiation: 0,
  team: 0,
});

// Computed total weight
const totalWeight = computed(() => {
  return (
    weights.value.founder +
    weights.value.market +
    weights.value.differentiation +
    weights.value.team
  );
});

// Computed customized score
const customizedScore = computed(() => {
  if (totalWeight.value !== 100) return 0;

  const score =
    (originalScores.value.founder * weights.value.founder) / 100 +
    (originalScores.value.market * weights.value.market) / 100 +
    (originalScores.value.differentiation * weights.value.differentiation) /
      100 +
    (originalScores.value.team * weights.value.team) / 100;

  return Math.round(score * 10) / 10;
});

// Recalculate on slider change
function recalculateScore() {
  console.log("Score recalculated:", customizedScore.value);
}

// Reset to defaults
function resetWeights() {
  weights.value = {
    founder: 25,
    market: 25,
    differentiation: 25,
    team: 25,
  };
}

const publicData = computed(() => {
  const data = (analysisData.value as any)?.public_data;
  console.log("🔍 DEBUG: Raw public_data from backend:", data);

  if (!data) {
    console.log("⚠️ No public_data in response");
    return {
      news: [],
      comprehensive_news: [],
      github_profiles: [],
      company_info: {},
      funding_profile: {},
      social_proof: {},
      market_data: {},
    };
  }

  const newsArray = data.comprehensive_news || data.news || [];
  console.log("📰 News array:", newsArray);
  console.log("📰 News count:", newsArray.length);
  console.log("📰 First article:", newsArray[0]);

  // ✅ FIX: Map comprehensive_news to news for compatibility
  return {
    ...data,
    news: newsArray,
    comprehensive_news: newsArray,
    github_profiles: data.github_profiles || [],
    company_info: data.company_info || {},
    funding_profile: data.funding_profile || {},
    social_proof: data.social_proof || {},
    market_data: data.market_data || {},
  };
});

// Helper computed properties for public data
const hasPublicData = computed(() => {
  return (
    hasGitHubData.value ||
    hasNewsData.value ||
    hasCompanyInfo.value ||
    hasFundingData.value ||
    hasSocialProof.value ||
    hasMarketData.value
  );
});

const hasGitHubData = computed(() => {
  return (
    publicData.value.github_profiles &&
    Array.isArray(publicData.value.github_profiles) &&
    publicData.value.github_profiles.length > 0
  );
});

const hasNewsData = computed(() => {
  const newsArray = publicData.value.news || [];

  console.log("🔍 hasNewsData check:");
  console.log("  - news array:", newsArray);
  console.log("  - is array:", Array.isArray(newsArray));
  console.log("  - length:", newsArray.length);

  const result = Array.isArray(newsArray) && newsArray.length > 0;
  console.log("  - RESULT:", result);

  return result;
});

const hasCompanyInfo = computed(() => {
  const info = publicData.value.company_info;
  if (!info) return false;
  return Object.values(info).some(
    (val) => val && val !== "Not available" && val !== "N/A"
  );
});

const hasFundingData = computed(() => {
  const funding = publicData.value.funding_profile;
  if (!funding) return false;
  return (
    Object.keys(funding).length > 0 && Object.values(funding).some((val) => val)
  );
});

const hasSocialProof = computed(() => {
  const social = publicData.value.social_proof;
  if (!social) return false;
  return (
    Object.keys(social).length > 0 && Object.values(social).some((val) => val)
  );
});

const hasMarketData = computed(() => {
  const market = publicData.value.market_data;
  if (!market) return false;
  return (
    Object.keys(market).length > 0 && Object.values(market).some((val) => val)
  );
});

const activeTab = ref("summary");
const showSourceModal = ref(false);
const selectedSource = ref<any>(null);
const selectedMetric = ref<any>(null);

const getSectorLabel = (sectorValue: string) => {
  const sector = getSectorByValue(sectorValue);
  return sector?.label || sectorValue;
};

const tabs = [
  { id: "summary", name: "Executive Summary", icon: "ri-file-text-line" },
  { id: "risk", name: "Investment Risks", icon: "ri-flag-line" },
  { id: "market", name: "Market Analysis", icon: "ri-bar-chart-box-line" },
  {
    id: "financial",
    name: "Financial Analysis",
    icon: "ri-money-dollar-circle-line",
  },
  { id: "traction", name: "Traction", icon: "ri-rocket-line" },
  { id: "call-prep", name: "Call Prep", icon: "ri-phone-line" },
  { id: "benchmarking", name: "Benchmarking", icon: "ri-line-chart-line" },
];

const showValidationSummary = computed(() => {
  return (
    analysisStore.partialAnalysis ||
    (analysisStore.validationSummary &&
      analysisStore.validationSummary.length > 0)
  );
});

// Helper computed properties for traction
const hasTractionData = computed(() => {
  const traction = analysisData.value?.traction;
  if (!traction) return false;

  return Object.values(traction).some(
    (value) =>
      value &&
      value !== "Not mentioned in document" &&
      value !== "Not specified in document"
  );
});

const hasSecondaryTraction = computed(() => {
  const traction = analysisData.value?.traction;
  if (!traction) return false;

  return (
    (traction.partnerships &&
      traction.partnerships !== "Not mentioned in document") ||
    (traction.awards && traction.awards !== "Not mentioned in document") ||
    (traction.media && traction.media !== "Not mentioned in document")
  );
});

// Helper functions for insights
function getCustomerInsight(customerData: string): string {
  if (!customerData) return "";

  const lower = customerData.toLowerCase();
  if (lower.includes("fortune 500") || lower.includes("enterprise")) {
    return "Strong enterprise presence";
  }
  if (lower.includes("growing") || lower.includes("expanding")) {
    return "Expanding customer base";
  }
  return "Established customer relationships";
}

function downloadQuestions() {
  const text = analysisData.value?.call_prep_questions || "";
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${analysisData.value.startupName}_CallPrepQuestions.txt`;
  link.click();
}

function copyQuestionsToClipboard() {
  const text = analysisData.value?.call_prep_questions || "";
  navigator.clipboard.writeText(text).then(() => {
    alert("Questions copied to clipboard!");
  });
}

function getRevenueInsight(revenueData: string): string {
  if (!revenueData) return "";

  const lower = revenueData.toLowerCase();
  if (lower.includes("mrr") || lower.includes("arr")) {
    return "Recurring revenue model";
  }
  if (lower.includes("growth") || lower.includes("increase")) {
    return "Revenue momentum evident";
  }
  return "Revenue generation established";
}

function getUserInsight(userData: string): string {
  if (!userData) return "";

  const lower = userData.toLowerCase();
  if (lower.includes("active") || lower.includes("mau")) {
    return "Strong user engagement";
  }
  if (lower.includes("grew") || lower.includes("doubled")) {
    return "Rapid user growth";
  }
  return "Established user base";
}

function extractGrowthRate(data: string): string | undefined {
  if (!data) return undefined;

  // Extract growth percentage or rate from the string
  const growthMatch = data.match(
    /(\d+(?:\.\d+)?%\s*(?:MoM|YoY|month-over-month|year-over-year))/i
  );
  if (growthMatch) {
    return growthMatch[1];
  }

  // Extract "doubled", "tripled", etc.
  if (data.toLowerCase().includes("doubled")) return "100% growth";
  if (data.toLowerCase().includes("tripled")) return "200% growth";

  return undefined;
}

function getTractionSummary(): string {
  const traction = analysisData.value?.traction;
  if (!traction) return "No traction data available";

  const metrics = [];
  if (
    traction.customers &&
    traction.customers !== "Not mentioned in document"
  ) {
    metrics.push("established customer base");
  }
  if (traction.revenue && traction.revenue !== "Not mentioned in document") {
    metrics.push("revenue generation");
  }
  if (traction.users && traction.users !== "Not mentioned in document") {
    metrics.push("active user engagement");
  }
  if (
    traction.growth_rate &&
    traction.growth_rate !== "Not mentioned in document"
  ) {
    metrics.push("documented growth");
  }

  if (metrics.length === 0) return "Limited traction data available";
  if (metrics.length === 1) return `Company shows ${metrics[0]}.`;
  if (metrics.length === 2)
    return `Company demonstrates ${metrics[0]} and ${metrics[1]}.`;

  return `Company demonstrates strong traction across multiple metrics including ${metrics.slice(0, -1).join(", ")}, and ${metrics[metrics.length - 1]}.`;
}

onMounted(() => {
  if (!analysisData.value) {
    console.warn("No analysis data found - redirecting to new analysis");
    console.log("=== ANALYSIS DATA ===");
    console.log("Full result:", analysisData.value);
    // console.log("Key Metrics:", analysisData.value.keyMetrics);
    // console.log("Risk Assessment:", analysisData.value.riskAssessment);
    // console.log("Summary Content:", analysisData.value.summaryContent);
    console.log("Validation Issues:", analysisStore.validationSummary);
    console.log("Completeness:", analysisStore.analysisCompleteness);
    console.log("=== TRACTION DATA DEBUG ===");
    console.log("Full analysis data:", analysisData.value);
    console.log("Traction data:", analysisData.value?.traction);
    console.log("Traction customers:", analysisData.value?.traction?.customers);
    console.log("Traction revenue:", analysisData.value?.traction?.revenue);
    console.log("hasTractionData computed:", hasTractionData.value);
    setTimeout(() => {
      router.push("/");
    }, 100);
  }

  const categoryScores = analysisData.value.recommendation.categoryScores;
  if (categoryScores) {
    originalScores.value = {
      founder: categoryScores.founder || 75,
      market: categoryScores.market || 75,
      differentiation: categoryScores.differentiation || 75,
      team: categoryScores.team || 75,
    };
  } else {
    // Fallback if backend doesn't send breakdown
    originalScores.value = {
      founder: 75,
      market: 75,
      differentiation: 75,
      team: 75,
    };
  }
  console.log("Scores loaded:", originalScores.value);
});

function getConfidenceClass() {
  const score = analysisData.value?.recommendation?.score || 0;
  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  return "low";
}

function getConfidenceLevel() {
  const score = analysisData.value?.recommendation?.score || 0;
  if (score >= 75) return "HIGH";
  if (score >= 50) return "MEDIUM";
  return "LOW";
}

function getMetricContext(label: string): string {
  const contexts: Record<string, string> = {
    "AI Projects Fail":
      "Industry benchmark showing adoption challenges in AI implementations",
    "Expected revenues in FY 25-26":
      "Company's projected near-term revenue target",
    "Time to Insights (With Sia)":
      "Processing time compared to conventional systems (3-4 days)",
    "Volume of Data Processed (With Sia)":
      "10x improvement over conventional data processing",
  };
  return contexts[label] || "Metric extracted from startup documentation";
}

function formatRiskType(type: string): string {
  const types: Record<string, string> = {
    "market-risk": "Market Risk",
    "execution-risk": "Execution Risk",
    "financial-risk": "Financial Risk",
    "technical-risk": "Technical Risk",
  };
  return types[type] || type;
}

function formatLabel(text: string): string {
  return text
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getConfidencePercentage(level: string): number {
  const map: Record<string, number> = { high: 90, medium: 70, low: 50 };
  return map[level] || 50;
}

function openSourceModal(metric: any) {
  selectedMetric.value = metric;
  selectedSource.value = metric.source;
  showSourceModal.value = true;
}

// async function handleExportPDF() {
//   try {
//     await analysisStore.exportReport();
//     alert("Report exported successfully!");
//   } catch (error: any) {
//     alert(`Export failed: ${error.message}`);
//   }
// }
async function handlePrintReport() {
  try {
    // Get all tab panes
    const tabPanes = document.querySelectorAll("[data-tab-pane]");

    // Store original display states
    const originalStates = Array.from(tabPanes).map((pane) => ({
      element: pane as HTMLElement,
      originalDisplay: (pane as HTMLElement).style.display,
      originalVisibility: (pane as HTMLElement).style.visibility,
    }));

    // Show all tabs temporarily
    tabPanes.forEach((pane) => {
      const el = pane as HTMLElement;
      el.style.display = "block";
      el.style.visibility = "visible";
    });

    // Add print styles temporarily
    const style = document.createElement("style");
    style.textContent = `
      @media print {
        .tabs-navigation { display: none; }
        .export-btn { display: none; }
        .action-buttons { display: none; }
        [data-tab-pane] {
          page-break-inside: avoid;
          page-break-after: always;
          display: block !important;
          visibility: visible !important;
        }
      }
    `;
    document.head.appendChild(style);

    // Wait a moment for DOM to update
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Open print dialog
    window.print();

    // Restore original states
    setTimeout(() => {
      originalStates.forEach(
        ({ element, originalDisplay, originalVisibility }) => {
          element.style.display = originalDisplay;
          element.style.visibility = originalVisibility;
        }
      );
      document.head.removeChild(style);
    }, 500);
  } catch (error) {
    console.error("Print failed:", error);
  }
}

async function handleExportMemo() {
  try {
    console.log("📋 Starting memo export...");
    await analysisStore.exportAsMemo();
    console.log("✅ Memo exported successfully!");
    // Optional: show toast notification here
  } catch (error: any) {
    console.error("❌ Export error:", error);
    alert(`❌ Failed to export memo: ${error.message}`);
  }
}

// Parse questions from raw text into structured array
function parseCallPrepQuestions(rawText: string): Array<{
  number: number;
  title: string;
  question: string;
  category: string;
}> {
  if (!rawText) return [];

  const lines = rawText.split("\n");
  const questions = [];
  let currentNumber = null;
  let currentTitle = "";
  let currentQuestion = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match numbered question at start of line
    const numberMatch = line.match(/^(\d+)\.\s+(.+)$/);

    if (numberMatch) {
      //  Save previous question COMPLETELY before starting new one
      if (currentNumber !== null) {
        const category = currentTitle.split(/[\[\]]/)[1] || currentTitle;
        questions.push({
          number: currentNumber,
          title: currentTitle,
          question: currentQuestion.trim(), // âœ… FULL question text
          category: extractCategory(category),
        });
      }

      //  Parse current question
      const [, number, rest] = numberMatch;
      currentNumber = parseInt(number);
      currentTitle = rest; // Get title/category
      currentQuestion = rest; // START with the full line
    } else if (currentNumber !== null && line.trim()) {
      //  APPEND all continuation lines
      currentQuestion += "\n" + line.trim();
    }
  }

  //  Don't forget the last question
  if (currentNumber !== null) {
    const category = currentTitle.split(/[\[\]]/)[1] || currentTitle;
    questions.push({
      number: currentNumber,
      title: currentTitle,
      question: currentQuestion.trim(), // âœ… FULL question text
      category: extractCategory(category),
    });
  }

  console.log("âœ… Parsed questions:", questions.length);
  questions.forEach((q) => {
    console.log(`Q${q.number}: ${q.question.substring(0, 80)}...`);
  });
  return questions;
}

function extractCategory(
  title: string
): "revenue" | "market" | "team" | "product" | "growth" | "other" {
  const lower = title.toLowerCase();
  if (lower.includes("revenue") || lower.includes("burn")) return "revenue";
  if (lower.includes("market") || lower.includes("adoption")) return "market";
  if (lower.includes("team") || lower.includes("capabilities")) return "team";
  if (lower.includes("product") || lower.includes("technical"))
    return "product";
  if (lower.includes("growth") || lower.includes("users")) return "growth";
  return "other";
}

// function extractCategoryLabel(title: string): string {
//   const lower = title.toLowerCase();

//   // Extract first bracket content if exists: "[Revenue] Question?"
//   const bracketMatch = lower.match(/^\[([^\]]+)\]/);
//   if (bracketMatch) {
//     return bracketMatch[1]; // Return just "[Revenue]"
//   }

//   // Extract first few words as category (max 5 words)
//   const words = lower.split(" ").slice(0, 5);
//   return words.join(" "); // "Given the projected ARR of"
// }

// function getCategoryIcon(category: string): string {
//   const icons = {
//     revenue: "ri-money-dollar-circle-fill",
//     market: "ri-bar-chart-box-fill",
//     team: "ri-team-fill",
//     product: "ri-lightbulb-flash-fill",
//     growth: "ri-rocket-2-fill",
//     other: "ri-question-line",
//   };
//   return icons[category as keyof typeof icons] || icons.other;
// }

function getCategoryColor(category: string): string {
  const colors = {
    revenue: "#ff6b6b",
    market: "#4ecdc4",
    team: "#a855f7",
    product: "#ffd93d",
    growth: "#22c55e",
    other: "#00d4ff",
  };
  return colors[category as keyof typeof colors] || colors.other;
}

// Computed property for parsed questions
const parsedCallPrepQuestions = computed(() => {
  if (!analysisData.value?.call_prep_questions) return [];
  return parseCallPrepQuestions(analysisData.value.call_prep_questions);
});

function getDifficultyLevel(question: string): string {
  const wordCount = question.split(" ").length;
  if (wordCount < 20) return "⭐ Quick Answer";
  if (wordCount < 50) return "⭐⭐ Medium";
  return "⭐⭐⭐ Deep Dive";
}

// function getQuestionContext(title: string, category: string): string {
//   const contexts: Record<string, string> = {
//     "Revenue Volatility":
//       "Understand revenue stability and conversion strategy",
//     "Market Adoption Risk":
//       "Assess market fit and customer acquisition strategy",
//     "Competitive Risk": "Evaluate sustainable competitive advantages",
//     "Active Users": "Validate user engagement and retention metrics",
//     "Monthly Burn Rate": "Understand cash runway and burn optimization",
//     "Team Capabilities": "Assess founder and team depth for execution",
//     "Unified XR Commerce Studio Claim":
//       "Verify technical implementation and AI integration",
//     Partnerships: "Understand ecosystem and revenue synergies",
//     "Website Visitors": "Assess marketing effectiveness and CAC",
//     "Growth Rate": "Validate growth acceleration and sustainability",
//   };
//   return contexts[title] || "Key insight for investment decision";
// }

function getQuestionContext(title: string, category: string): string {
  const contexts: Record<string, string> = {
    revenue: "Validates unit economics and revenue assumptions",
    market: "Tests market adoption strategy and TAM understanding",
    team: "Validates founder's relevant experience and capabilities",
    product: "Measures product-market fit and technical execution",
    growth: "Assesses growth drivers and scalability",
    other: "Key insight for investment decision",
  };
  return contexts[category] || "Key insight for investment decision";
}

function emailQuestions() {
  const questions = parsedCallPrepQuestions.value
    .map((q) => `${q.number}. [${q.title}] ${q.question}`)
    .join("\n\n");

  const subject = `Pre-Call Questions - ${analysisData.value.startupName}`;
  const body = encodeURIComponent(
    `Hi,\n\nPlease review these questions before our call:\n\n${questions}\n\nThanks!`
  );

  window.open(`mailto:?subject=${subject}&body=${body}`);
}

// Parse benchmarking data into structured format
function parseBenchmarkingData(rawText: string): {
  metrics: Array<{
    name: string;
    companyValue: number;
    benchmarkValue: number;
    percentile: number;
    rating: "above" | "average" | "below";
    insight: string;
  }>;
  summary: string;
} {
  // Extract key metrics from the text
  const metrics = [];
  const lines = rawText.split("\n");

  // Try to extract structured data
  // This is a basic parser - adjust based on Gemini output format

  return {
    metrics: [
      {
        name: "Revenue per Employee",
        companyValue: 750000,
        benchmarkValue: 500000,
        percentile: 75,
        rating: "above",
        insight: "Strong revenue efficiency",
      },
      {
        name: "Customer Acquisition Cost",
        companyValue: 5000,
        benchmarkValue: 8000,
        percentile: 70,
        rating: "above",
        insight: "Efficient marketing spend",
      },
      {
        name: "Team Experience (years)",
        companyValue: 5,
        benchmarkValue: 8,
        percentile: 40,
        rating: "below",
        insight: "Opportunity: Hire experienced talent",
      },
    ],
    summary: rawText.substring(0, 200),
  };
}

const structuredBenchmarking = computed(() => {
  if (!analysisData.value?.benchmarking) return null;
  return parseBenchmarkingData(analysisData.value.benchmarking);
});

function getBenchmarkRatingIcon(rating: string): string {
  return rating === "above" ? "🟢" : rating === "below" ? "🔴" : "🟡";
}

function getBenchmarkRatingColor(rating: string): string {
  return rating === "above"
    ? "#22c55e"
    : rating === "below"
      ? "#ef4444"
      : "#eab308";
}
</script>

<style lang="scss" scoped>
.page-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f1929 0%, #1a2332 100%);
  padding: 40px 20px;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
  gap: 20px;

  .header-main {
    flex: 1;

    h1 {
      font-size: 2.2em;
      color: #ffffff;
      margin-bottom: 12px;
      font-weight: 600;
    }
  }

  .export-btn {
    padding: 12px 24px;
    border-radius: 8px;
    border: none;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;

    &.primary {
      background: linear-gradient(135deg, #00d4ff, #0099ff);
      color: white;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 212, 255, 0.3);
      }
    }
  }
}

.analysis-badges {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;

  .analysis-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 0.9em;
    font-weight: 500;

    &.confidence {
      background: rgba(0, 212, 255, 0.1);
      color: #00d4ff;
      border: 1px solid rgba(0, 212, 255, 0.3);

      &.high {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
        border-color: rgba(34, 197, 94, 0.3);
      }
    }
  }
}

.recommendation-box {
  background: linear-gradient(
    135deg,
    rgba(0, 212, 255, 0.1),
    rgba(0, 153, 255, 0.05)
  );
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 40px;

  .recommendation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .label {
      font-size: 0.85em;
      color: rgba(255, 255, 255, 0.6);
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }

    .badge {
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.85em;
      font-weight: 500;

      &.complete {
        background: rgba(34, 197, 94, 0.2);
      }
    }
  }

  .recommendation-text {
    font-size: 2em;
    color: #00d4ff;
    margin-bottom: 20px;
    font-weight: 700;
  }

  .recommendation-score {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 20px;

    .score-label {
      color: rgba(255, 255, 255, 0.7);
      font-weight: 500;
    }

    .score-bar {
      flex: 1;
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;

      .score-fill {
        height: 100%;
        background: linear-gradient(90deg, #00d4ff, #0099ff);
        transition: width 0.5s ease;
      }
    }

    .score-value {
      color: #00d4ff;
      font-weight: 700;
      font-size: 1.1em;
      min-width: 60px;
    }
  }

  .recommendation-justification {
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.6;
    font-size: 1em;
  }
}

.tabs-navigation {
  display: flex;
  gap: 8px;
  margin-bottom: 40px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  overflow-x: auto;
  padding-bottom: 0;

  .tab-btn {
    padding: 16px 20px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
    border-bottom: 3px solid transparent;
    transition: all 0.3s ease;

    i {
      font-size: 1.1em;
    }

    .tab-count {
      background: rgba(0, 212, 255, 0.2);
      color: #00d4ff;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.85em;
      margin-left: 4px;
    }

    &:hover {
      color: rgba(255, 255, 255, 0.8);
    }

    &.active {
      color: #00d4ff;
      border-bottom-color: #00d4ff;
    }
  }
}

.tab-content {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 40px;
  margin-bottom: 40px;
}

.tab-pane {
  animation: fadeIn 0.3s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  h3 {
    font-size: 1.5em;
    color: #ffffff;
    margin-bottom: 24px;
    font-weight: 600;
  }

  h4 {
    font-size: 1.2em;
    color: #ffffff;
    margin-bottom: 16px;
    margin-top: 24px;
    font-weight: 600;

    &:first-child {
      margin-top: 0;
    }
  }
}

.summary-section {
  margin-bottom: 32px;

  h3 {
    font-size: 1.2em;
    color: #00d4ff;
    margin-bottom: 12px;
    font-weight: 600;
  }

  p {
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.7;
    font-size: 1em;
  }
}

.metrics-section {
  margin-top: 40px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.metric-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 10px;
  padding: 20px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 212, 255, 0.08);
    border-color: rgba(0, 212, 255, 0.4);
  }

  .metric-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;

    h4 {
      margin: 0;
      color: #ffffff;
      font-size: 0.95em;
      font-weight: 600;
      flex: 1;
    }

    .confidence-badge {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75em;
      font-weight: 600;
      text-transform: uppercase;
      white-space: nowrap;
      margin-left: 8px;

      &.high {
        background: rgba(34, 197, 94, 0.2);
        color: #22c55e;
      }

      &.medium {
        background: rgba(234, 179, 8, 0.2);
        color: #eab308;
      }

      &.low {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
      }
    }
  }

  .metric-value {
    font-size: 1.8em;
    color: #00d4ff;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .metric-context {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.9em;
    margin-bottom: 12px;
    line-height: 1.4;
  }

  .verify-btn {
    width: 100%;
    padding: 8px 12px;
    background: rgba(0, 212, 255, 0.1);
    border: 1px solid rgba(0, 212, 255, 0.3);
    color: #00d4ff;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;

    &:hover {
      background: rgba(0, 212, 255, 0.2);
      border-color: rgba(0, 212, 255, 0.5);
    }
  }
}

.risks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}

.risk-card {
  background: rgba(255, 255, 255, 0.03);
  border-left: 4px solid;
  border-radius: 8px;
  padding: 20px;

  &.risk-high {
    border-left-color: #ef4444;
    background: rgba(239, 68, 68, 0.05);
  }

  &.risk-medium {
    border-left-color: #eab308;
    background: rgba(234, 179, 8, 0.05);
  }

  &.risk-low {
    border-left-color: #22c55e;
    background: rgba(34, 197, 94, 0.05);
  }

  .risk-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .risk-type {
      font-size: 0.9em;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 500;
      text-transform: uppercase;
    }

    .risk-level {
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 0.8em;
      font-weight: 600;
      text-transform: uppercase;

      &.high {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
      }

      &.medium {
        background: rgba(234, 179, 8, 0.2);
        color: #eab308;
      }

      &.low {
        background: rgba(34, 197, 94, 0.2);
        color: #22c55e;
      }
    }
  }

  h4 {
    margin: 0 0 12px 0;
    color: #ffffff;
    font-size: 1.1em;
    font-weight: 600;
  }

  .risk-description {
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 16px;
    line-height: 1.5;
  }

  .risk-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;

    .detail-item {
      background: rgba(255, 255, 255, 0.05);
      padding: 12px;
      border-radius: 6px;

      strong {
        color: rgba(255, 255, 255, 0.9);
        display: block;
        margin-bottom: 6px;
        font-size: 0.9em;
      }

      p {
        color: rgba(255, 255, 255, 0.7);
        margin: 0;
        font-size: 0.9em;
        line-height: 1.4;
      }
    }
  }
}

.market-sizing {
  margin-bottom: 40px;

  h4 {
    margin-bottom: 20px;
  }
}

.sizing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.sizing-card {
  background: rgba(0, 212, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 8px;
  padding: 16px;
  text-align: center;

  .sizing-label {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.9em;
    text-transform: uppercase;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .sizing-value {
    color: #00d4ff;
    font-size: 1.4em;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .sizing-desc {
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.85em;
  }
}

.competitive-section {
  margin-top: 30px;
}

.competitors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.competitor-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;

  h5 {
    color: #00d4ff;
    margin: 0 0 12px 0;
    font-size: 1em;
    font-weight: 600;
  }

  .comp-detail {
    margin-bottom: 12px;

    strong {
      color: rgba(255, 255, 255, 0.8);
      display: block;
      margin-bottom: 4px;
      font-size: 0.9em;
    }

    p {
      color: rgba(255, 255, 255, 0.6);
      margin: 0;
      font-size: 0.9em;
      line-height: 1.4;
    }
  }
}

.financial-section {
  margin-bottom: 30px;
}

.projections-table {
  overflow-x: auto;

  table {
    width: 100%;
    border-collapse: collapse;

    thead {
      background: rgba(0, 212, 255, 0.1);

      th {
        padding: 12px;
        color: #00d4ff;
        font-weight: 600;
        text-align: left;
        font-size: 0.95em;
        border-bottom: 2px solid rgba(0, 212, 255, 0.2);
      }
    }

    tbody {
      tr {
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);

        &:hover {
          background: rgba(0, 212, 255, 0.05);
        }

        td {
          padding: 12px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.95em;
        }
      }
    }
  }
}

.valuation-section {
  margin-top: 30px;
}

.valuation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.valuation-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;

  strong {
    color: rgba(255, 255, 255, 0.9);
    display: block;
    margin-bottom: 8px;
    font-size: 0.95em;
  }

  p {
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
    font-size: 0.9em;
    line-height: 1.4;
  }
}

.terms-section {
  margin-top: 30px;
}

.terms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.term-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;

  strong {
    color: rgba(255, 255, 255, 0.9);
    display: block;
    margin-bottom: 8px;
    font-size: 0.95em;
  }

  p {
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
    font-size: 0.9em;
  }
}

.traction-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;

  .traction-item {
    background: rgba(34, 197, 94, 0.05);
    border: 1px solid rgba(34, 197, 94, 0.2);
    border-radius: 8px;
    padding: 16px;

    h4 {
      margin: 0 0 12px 0;
      color: #22c55e;
      font-size: 1em;
      font-weight: 600;
    }

    p {
      color: rgba(255, 255, 255, 0.8);
      margin: 0;
      line-height: 1.5;
    }
  }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1em;
}

.documents-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 40px;

  h4 {
    color: #ffffff;
    margin: 0 0 16px 0;
    font-size: 1.1em;
    font-weight: 600;
  }
}

.documents-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
}

.doc-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 212, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.1);
  border-radius: 8px;

  i {
    color: #00d4ff;
    font-size: 1.5em;
  }

  .doc-info {
    flex: 1;

    strong {
      color: #ffffff;
      display: block;
      margin-bottom: 4px;
    }

    .doc-meta {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.85em;
    }
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: #1a2332;
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.5em;
  cursor: pointer;
  transition: color 0.3s ease;

  &:hover {
    color: #ffffff;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 24px 16px;
  border-bottom: 1px solid rgba(0, 212, 255, 0.1);

  i {
    color: #22c55e;
    font-size: 1.5em;
  }

  h3 {
    margin: 0;
    color: #ffffff;
    font-size: 1.2em;
    font-weight: 600;
  }
}

.modal-body {
  padding: 24px;

  .source-item {
    margin-bottom: 20px;

    strong {
      color: rgba(255, 255, 255, 0.9);
      display: block;
      margin-bottom: 8px;
      font-size: 0.95em;
    }

    p {
      color: rgba(255, 255, 255, 0.7);
      margin: 0;
      line-height: 1.5;
    }

    .confidence-indicator {
      background: rgba(255, 255, 255, 0.05);
      padding: 8px 12px;
      border-radius: 6px;
      font-weight: 600;
      margin: 0;

      &.high {
        background: rgba(34, 197, 94, 0.2);
        color: #22c55e;
      }

      &.medium {
        background: rgba(234, 179, 8, 0.2);
        color: #eab308;
      }

      &.low {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
      }
    }
  }
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(0, 212, 255, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  .btn {
    padding: 8px 16px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;

    &.secondary {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.8);

      &:hover {
        background: rgba(255, 255, 255, 0.15);
      }
    }
  }
}

.no-data {
  text-align: center;
  padding: 100px 20px;
  color: rgba(255, 255, 255, 0.6);

  p {
    margin-bottom: 20px;
    font-size: 1.1em;
  }

  .btn {
    display: inline-block;
    padding: 12px 24px;
    background: linear-gradient(135deg, #00d4ff, #0099ff);
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 212, 255, 0.3);
    }
  }
}
.sector-info {
  display: flex;
  gap: 16px;
  margin: 20px 0 10px 0;
  align-items: center;
  flex-wrap: wrap;
}

.sector-badge,
.industry-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  border: 1px solid #667eea;
}

.industry-badge {
  background: rgba(240, 147, 251, 0.1);
  color: #f093fb;
  border-color: #f093fb;
}

@media (max-width: 768px) {
  .sector-info {
    margin-top: 16px;
    gap: 12px;
  }

  .sector-badge,
  .industry-badge {
    font-size: 0.85rem;
    padding: 8px 12px;
  }
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;

    .export-btn {
      width: 100%;
      justify-content: center;
    }
  }

  .tabs-navigation {
    .tab-btn {
      padding: 12px 16px;
      font-size: 0.9em;
    }
  }

  .metrics-grid,
  .risks-grid,
  .sizing-grid,
  .competitors-grid,
  .valuation-grid,
  .terms-grid,
  .traction-section,
  .documents-list {
    grid-template-columns: 1fr;
  }

  .tab-content {
    padding: 20px;
  }

  .modal-content {
    max-width: 90vw;
  }
}

// Public Data Styling
.public-data-card {
  background: rgba(100, 150, 255, 0.05);
  border-left: 4px solid #0066cc;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;

  h4 {
    color: #0066cc;
    margin: 0 0 12px 0;
    font-size: 1.1em;
    font-weight: 600;
  }
}

.news-list {
  display: grid;
  gap: 12px;
}

.news-item {
  background: white;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid rgba(0, 102, 204, 0.2);

  .news-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 6px;

    strong {
      color: #1a1a1a;
      font-size: 0.95em;
      flex: 1;
    }

    .news-type {
      background: rgba(0, 102, 204, 0.1);
      color: #0066cc;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75em;
      font-weight: 600;
      text-transform: uppercase;
      white-space: nowrap;
      margin-left: 8px;
    }
  }

  .news-meta {
    color: rgba(0, 0, 0, 0.6);
    font-size: 0.85em;
    line-height: 1.4;
  }
}

.funding-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.funding-item {
  background: white;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid rgba(0, 102, 204, 0.2);

  strong {
    color: #0066cc;
    display: block;
    margin-bottom: 4px;
    font-size: 0.9em;
  }

  p {
    color: #333;
    margin: 0;
    font-size: 0.9em;
    line-height: 1.4;
  }
}

.proof-item,
.market-item {
  background: white;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 8px;
  border-left: 3px solid #22aa44;

  strong {
    color: #22aa44;
    margin-right: 6px;
  }

  &:last-child {
    margin-bottom: 0;
  }
}

@media (max-width: 768px) {
  .public-data-card {
    padding: 12px;
    margin-bottom: 12px;

    h4 {
      font-size: 1em;
    }
  }

  .funding-grid {
    grid-template-columns: 1fr;
  }
}

// Enhanced Traction Section
.traction-section-enhanced {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.traction-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.secondary-traction {
  h4 {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    color: #ffffff;
    font-size: 16px;

    i {
      color: $color-accent;
    }
  }
}

.secondary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.traction-summary-card {
  background: rgba($color-accent, 0.05);
  border: 1px solid rgba($color-accent, 0.2);
  border-radius: 12px;
  padding: 20px;

  h4 {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 12px 0;
    color: $color-accent;
    font-size: 16px;

    i {
      font-size: 18px;
    }
  }

  p {
    margin: 0;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.6;
  }
}

@media (max-width: 768px) {
  .traction-grid,
  .secondary-grid {
    grid-template-columns: 1fr;
  }
}

// Enhanced Public Data Section
.public-data-section {
  .section-intro {
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
    margin-bottom: 24px;
    font-style: italic;
  }
}

.public-data-group {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

// GitHub Profiles
.github-profiles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.github-profile-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(99, 102, 241, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.15);
  }

  .profile-link {
    display: block;
    padding: 16px;
    text-decoration: none;
    color: inherit;
  }
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.profile-avatar {
  width: 48px;
  height: 48px;
  background: rgba(99, 102, 241, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  i {
    font-size: 24px;
    color: #6366f1;
  }
}

.profile-info {
  flex: 1;
  min-width: 0;

  h5 {
    margin: 0 0 4px 0;
    font-size: 15px;
    color: #ffffff;
    font-weight: 600;
  }

  .username {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
  }
}

.profile-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);

  i {
    color: #6366f1;
  }
}

.profile-bio {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

// News Grid
.news-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

// Company Info
.company-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.info-item {
  background: rgba(255, 255, 255, 0.02);
  padding: 14px;
  border-radius: 8px;
  border: 1px solid rgba(0, 212, 255, 0.1);

  &.full-width {
    grid-column: 1 / -1;
  }

  &:hover {
    border-color: rgba(0, 212, 255, 0.3);
  }
}

.info-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
  font-weight: 600;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  i {
    color: $color-accent;
    font-size: 14px;
  }
}

.info-value {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;

  &.link {
    display: flex;
    align-items: center;
    gap: 6px;
    color: $color-accent;
    text-decoration: none;
    transition: all 0.3s ease;

    &:hover {
      color: lighten($color-accent, 10%);

      i {
        transform: translateX(2px);
      }
    }

    i {
      font-size: 14px;
      transition: transform 0.3s ease;
    }
  }

  &.description {
    font-size: 13px;
    line-height: 1.6;
  }

  &.highlight {
    color: $color-success;
    font-weight: 600;
    font-size: 15px;
  }
}

// Funding Profile
.funding-profile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.funding-item {
  background: rgba(34, 197, 94, 0.05);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid rgba(34, 197, 94, 0.2);
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(34, 197, 94, 0.4);
    transform: translateY(-2px);
  }
}

.funding-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.funding-value {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.5;
  font-weight: 500;

  &.highlight {
    color: $color-success;
    font-size: 16px;
    font-weight: 700;
  }
}

// Social Proof
.social-proof-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.proof-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: rgba(168, 85, 247, 0.05);
  border-radius: 8px;
  border-left: 3px solid #a855f7;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(168, 85, 247, 0.08);
    transform: translateX(4px);
  }
}

.proof-icon {
  width: 40px;
  height: 40px;
  background: rgba(168, 85, 247, 0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  i {
    font-size: 20px;
    color: #a855f7;
  }
}

.proof-content {
  flex: 1;

  strong {
    display: block;
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
    margin-bottom: 6px;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: rgba(255, 255, 255, 0.7);
    font-size: 13px;
    line-height: 1.5;
  }
}

// Market Intelligence
.market-data-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.market-item {
  background: rgba(245, 158, 11, 0.05);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid rgba(245, 158, 11, 0.2);
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(245, 158, 11, 0.4);
    transform: translateY(-2px);
  }
}

.market-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  i {
    color: #f59e0b;
    font-size: 16px;
  }
}

.market-value {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
}

// Responsive Design
@media (max-width: 768px) {
  .github-profiles-grid,
  .news-grid,
  .company-info-grid,
  .funding-profile-grid {
    grid-template-columns: 1fr;
  }

  .info-item.full-width {
    grid-column: 1;
  }

  .proof-item {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .proof-content {
    text-align: center;
  }
}

.weightage-customization {
  background: rgba(0, 212, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
  margin-top: 30px;

  h4 {
    margin: 0 0 20px 0;
  }
}

.weight-slider-group {
  margin-bottom: 20px;
}

.weight-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.weight-value {
  color: #00d4ff;
  font-weight: 600;
}

.weight-slider {
  width: 100%;
  height: 6px;
  appearance: none;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
  border-radius: 3px;
  cursor: pointer;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    background: #00d4ff;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.5);
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: #00d4ff;
    border: none;
    border-radius: 50%;
    cursor: pointer;
  }
}

.weight-total {
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  text-align: center;
  margin: 16px 0;
  font-weight: 600;

  &.valid {
    border: 1px solid #22c55e;
    color: #22c55e;
  }

  &.invalid {
    border: 1px solid #ef4444;
    color: #ef4444;
  }
}

.customized-score-display {
  background: linear-gradient(
    135deg,
    rgba(0, 212, 255, 0.1),
    rgba(34, 197, 94, 0.1)
  );
  padding: 16px;
  border-radius: 8px;
  margin: 16px 0;
  text-align: center;

  h3 {
    margin: 0;
  }
}

.reset-btn {
  width: 100%;
  padding: 10px;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  color: #00d4ff;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 212, 255, 0.2);
  }
}

.call-prep-section,
.benchmarking-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}

.questions-display,
.benchmarking-display {
  pre {
    background: rgba(255, 255, 255, 0.05);
    padding: 12px;
    border-radius: 6px;
    overflow-x: auto;
    font-size: 12px;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.8);
  }
}

.call-prep-actions,
.benchmark-legend {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.action-btn {
  flex: 1;
  min-width: 150px;
  padding: 10px 16px;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  color: #00d4ff;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:hover {
    background: rgba(0, 212, 255, 0.2);
  }
}

.benchmark-legend {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  justify-content: space-around;

  span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.customize-weights-btn {
  margin-top: 12px;
  padding: 10px 20px;
  background: rgba(0, 212, 255, 0.2);
  border: 1px solid rgba(0, 212, 255, 0.4);
  color: #00d4ff;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 212, 255, 0.3);
  }
}

.weightage-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.weightage-modal-content {
  background: #1a2332;
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 12px;
  padding: 24px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.questions-content {
  background: rgba(255, 255, 255, 0.05);
  padding: 16px;
  border-radius: 8px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.8);
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 13px;
}

.weightage-note {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 8px;
  text-align: center;
}

// ============================================================================
// BENCHMARKING STYLING
// ============================================================================

.benchmarking-section {
  margin-top: 16px;
}

.tab-description {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  margin-bottom: 24px;
  line-height: 1.5;
}

.benchmark-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.overview-card {
  background: linear-gradient(
    135deg,
    rgba(0, 212, 255, 0.1),
    rgba(34, 197, 94, 0.05)
  );
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 8px;
  padding: 16px;
  text-align: center;

  .overview-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .overview-value {
    font-size: 24px;
    font-weight: 700;
    color: #00d4ff;
    margin-bottom: 6px;
  }

  .overview-desc {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    margin: 0;
  }
}

.metrics-comparison {
  margin-bottom: 32px;

  h4 {
    margin: 0 0 16px 0;
    color: #ffffff;
    font-size: 16px;
    font-weight: 600;
  }
}

.comparison-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.metric-comparison-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-top: 3px solid;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;
  max-height: none;
  overflow: visible;

  &.above-average {
    border-top-color: #22c55e;

    &:hover {
      background: rgba(34, 197, 94, 0.05);
      border-color: rgba(34, 197, 94, 0.3);
    }
  }

  &.average {
    border-top-color: #eab308;

    &:hover {
      background: rgba(234, 179, 8, 0.05);
      border-color: rgba(234, 179, 8, 0.3);
    }
  }

  &.below-average {
    border-top-color: #ef4444;

    &:hover {
      background: rgba(239, 68, 68, 0.05);
      border-color: rgba(239, 68, 68, 0.3);
    }
  }
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.metric-name {
  font-weight: 600;
  color: #ffffff;
  font-size: 14px;
  flex: 1;
}

.metric-rating {
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.metric-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.comparison-item {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }

  .value {
    font-size: 16px;
    font-weight: 700;
    color: #00d4ff;
    white-space: normal;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
  }
}

.metric-bar-container {
  margin-bottom: 12px;
  padding: 8px 0;
}

.bar-background {
  position: relative;
  height: 24px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.bar-benchmark {
  position: absolute;
  height: 100%;
  background: rgba(234, 179, 8, 0.3);
  border-right: 2px solid rgba(234, 179, 8, 0.6);
}

.bar-company {
  position: absolute;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(34, 197, 94, 0.2),
    rgba(34, 197, 94, 0.4)
  );
  border-right: 2px solid rgba(34, 197, 94, 0.8);
}

.metric-insight {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.03);
  padding: 8px;
  border-radius: 4px;
  margin: 0;
  line-height: 1.4;
  white-space: normal;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.benchmark-legend {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  margin-bottom: 32px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.improvement-recommendations {
  h4 {
    margin: 0 0 16px 0;
    color: #ffffff;
    font-size: 16px;
    font-weight: 600;
  }
}

.recommendations-list {
  display: grid;
  gap: 12px;
}

.recommendation-item {
  display: flex;
  gap: 12px;
  background: rgba(255, 255, 255, 0.02);
  border-left: 3px solid #00d4ff;
  border-radius: 6px;
  padding: 14px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 212, 255, 0.05);
    border-left-color: #00d4ff;
    transform: translateX(4px);
  }
}

.rec-number {
  min-width: 32px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 212, 255, 0.2);
  border-radius: 50%;
  font-weight: 700;
  color: #00d4ff;
  flex-shrink: 0;
}

.rec-content {
  flex: 1;

  h5 {
    margin: 0 0 6px 0;
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
  }

  p {
    margin: 0 0 6px 0;
    color: rgba(255, 255, 255, 0.7);
    font-size: 13px;
    line-height: 1.4;
  }

  .rec-impact {
    display: block;
    font-size: 12px;
    color: #22c55e;
    font-weight: 600;
  }
}

.benchmarking-display {
  pre {
    background: rgba(255, 255, 255, 0.03);
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    font-size: 12px;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: none; // Hide raw text output
  }
}

@media (max-width: 768px) {
  .benchmark-overview {
    grid-template-columns: 1fr;
  }

  .comparison-grid {
    grid-template-columns: 1fr;
  }

  .metric-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .benchmark-legend {
    grid-template-columns: 1fr;
  }
}

// ============================================================================
// CALL PREP - PROFESSIONAL & BEAUTIFUL DESIGN
// ============================================================================

.call-prep-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(0, 212, 255, 0.1);

  h3 {
    margin: 0 0 8px 0;
    font-size: 1.8em;
    color: #ffffff;
    font-weight: 700;
  }
}

.call-prep-subtitle {
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.95em;
  line-height: 1.4;
}

.call-prep-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.call-prep-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

// Category Stats Bar
// .category-stats-bar {
//   display: grid;
//   grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
//   gap: 12px;
//   padding: 20px;
//   background: linear-gradient(
//     135deg,
//     rgba(0, 212, 255, 0.05),
//     rgba(34, 197, 94, 0.02)
//   );
//   border: 1px solid rgba(0, 212, 255, 0.1);
//   border-radius: 12px;
//   backdrop-filter: blur(10px);
// }

// .cat-stat {
//   display: flex;
//   align-items: center;
//   gap: 10px;
//   padding: 12px 16px;
//   background: rgba(255, 255, 255, 0.02);
//   border-left: 3px solid;
//   border-radius: 8px;
//   transition: all 0.3s ease;

//   &:hover {
//     background: rgba(255, 255, 255, 0.05);
//     transform: translateY(-2px);
//   }

//   i {
//     font-size: 16px;
//   }

//   .cat-name {
//     font-size: 12px;
//     font-weight: 600;
//     color: rgba(255, 255, 255, 0.8);
//     text-transform: uppercase;
//     letter-spacing: 0.5px;
//   }

//   .cat-count {
//     margin-left: auto;
//     background: rgba(255, 255, 255, 0.1);
//     color: #00d4ff;
//     font-weight: 700;
//     font-size: 13px;
//     padding: 2px 8px;
//     border-radius: 10px;
//   }
// }

// Questions Grid
.questions-grid-pro {
  display: grid;
  gap: 16px;
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Question Cards
.question-card-pro {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.03),
    rgba(255, 255, 255, 0.01)
  );
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: 4px solid;
  border-radius: 10px;
  padding: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, var(--accent-color), transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.06),
      rgba(255, 255, 255, 0.03)
    );
    border-color: rgba(255, 255, 255, 0.15);
    box-shadow: 0 8px 32px rgba(0, 212, 255, 0.08);
    transform: translateY(-4px);

    &::before {
      opacity: 1;
    }

    // .q-title-pro {
    //   color: var(--accent-color);
    // }
  }
}

.q-header-pro {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  align-items: flex-start;
}

.q-number-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: linear-gradient(
    135deg,
    rgba(0, 212, 255, 0.2),
    rgba(0, 212, 255, 0.08)
  );
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 8px;
  font-weight: 700;
  color: #00d4ff;
  font-size: 14px;
  flex-shrink: 0;
}

.q-header-info {
  flex: 1;
  min-width: 0;
}

.q-meta {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

// .q-category-badge {
//   display: inline-flex;
//   align-items: center;
//   gap: 6px;
//   padding: 6px 12px;
//   border: 1px solid;
//   border-radius: 6px;
//   font-size: 11px;
//   font-weight: 600;
//   text-transform: uppercase;
//   letter-spacing: 0.4px;

//   i {
//     font-size: 13px;
//   }
// }

.q-difficulty {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
}

// .q-title-pro {
//   margin: 0 0 12px 0;
//   font-size: 14px;
//   font-weight: 600;
//   color: #00d4ff;
//   text-transform: uppercase;
//   letter-spacing: 0.5px;
//   transition: color 0.3s ease;
// }

.q-body-pro {
  margin: 0 0 14px 0;
  font-size: 14px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.85);
  word-wrap: break-word;
  white-space: normal;
  display: block;
  overflow: visible;
  max-height: none;
}

.q-insight {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  background: linear-gradient(
    135deg,
    rgba(0, 212, 255, 0.08),
    rgba(0, 212, 255, 0.03)
  );
  border: 1px solid rgba(0, 212, 255, 0.15);
  border-radius: 8px;
  font-size: 12px;
  color: rgba(0, 212, 255, 0.9);
  line-height: 1.5;

  i {
    font-size: 14px;
    flex-shrink: 0;
    margin-top: 1px;
  }
}

// Action Buttons
.call-prep-actions-pro {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.action-btn-pro {
  padding: 16px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  i {
    font-size: 18px;
  }

  .btn-meta {
    font-size: 11px;
    opacity: 0.8;
    font-weight: 400;
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.1);
    transition: left 0.3s ease;
    z-index: -1;
  }

  &:hover::before {
    left: 0;
  }

  &.primary {
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(34, 197, 94, 0.3);
    }
  }

  &.secondary {
    background: linear-gradient(135deg, #00d4ff, #0099ff);
    color: white;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 212, 255, 0.3);
    }
  }

  &.tertiary {
    background: linear-gradient(135deg, #a855f7, #7c3aed);
    color: white;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(168, 85, 247, 0.3);
    }
  }
}

// Footer
.call-prep-footer {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  padding: 20px;
  background: linear-gradient(
    135deg,
    rgba(0, 212, 255, 0.05),
    rgba(34, 197, 94, 0.02)
  );
  border: 1px solid rgba(0, 212, 255, 0.1);
  border-radius: 10px;
  margin-top: 24px;
}

.footer-stat {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);

  i {
    font-size: 16px;
    color: #00d4ff;
  }

  strong {
    color: #ffffff;
  }
}

// Empty State
.call-prep-empty {
  text-align: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.5);

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.6;
  }

  h4 {
    margin: 0 0 8px 0;
    font-size: 18px;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 600;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

// Responsive
@media (max-width: 768px) {
  .call-prep-header {
    margin-bottom: 24px;

    h3 {
      font-size: 1.4em;
    }
  }

  // .category-stats-bar {
  //   grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  // }

  .question-card-pro {
    padding: 16px;
  }

  .call-prep-actions-pro {
    grid-template-columns: 1fr;
  }

  .call-prep-footer {
    grid-template-columns: 1fr;
  }
}
</style>
