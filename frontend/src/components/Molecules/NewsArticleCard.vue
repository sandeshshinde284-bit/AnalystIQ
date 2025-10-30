<template>
  <a
    v-if="article.url || article.link"
    :href="article.url || article.link"
    target="_blank"
    rel="noopener noreferrer"
    class="news-article-card"
  >
    <div class="article-content">
      <div class="article-header">
        <!-- ✅ Handle missing type -->
        <span v-if="article.type" class="article-type" :class="typeClass">
          {{ article.type }}
        </span>
        <span v-else class="article-type type-default">Article</span>

        <!-- ✅ Handle missing date -->
        <span v-if="article.date" class="article-date">
          {{ formatDate(article.date) }}
        </span>
        <span v-else class="article-date">Recent</span>
      </div>

      <h4 class="article-title">{{ article.title }}</h4>

      <p v-if="article.snippet" class="article-snippet">
        {{ article.snippet }}
      </p>

      <div class="article-meta">
        <span class="article-source">
          <i class="ri-newspaper-line"></i>
          {{ article.source }}
        </span>
        <span class="read-more">
          Read more <i class="ri-arrow-right-line"></i>
        </span>
      </div>
    </div>
  </a>

  <div v-else class="news-article-card disabled">
    <div class="article-content">
      <div class="article-header">
        <span v-if="article.type" class="article-type" :class="typeClass">
          {{ article.type }}
        </span>
        <span v-else class="article-type type-default"> Article </span>
        <span v-if="article.date" class="article-date">
          {{ formatDate(article.date) }}
        </span>
      </div>

      <h4 class="article-title">{{ article.title }}</h4>

      <p v-if="article.snippet" class="article-snippet">
        {{ article.snippet }}
      </p>

      <div class="article-meta">
        <span class="article-source">
          <i class="ri-newspaper-line"></i>
          {{ article.source }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Article {
  title: string;
  type?: string; // ← Make optional
  source: string;
  date?: string; // ← Make optional
  url?: string; // ← Keep for compatibility
  link?: string; // ← ADD: Backend uses this
  snippet?: string;
}

interface Props {
  article: Article;
}

const props = defineProps<Props>();

const typeClass = computed(() => {
  if (!props.article.type) return "type-default";
  const type = props.article.type.toLowerCase();
  if (type.includes("press")) return "type-press";
  if (type.includes("news")) return "type-news";
  if (type.includes("announcement")) return "type-announcement";
  if (type.includes("award")) return "type-award";
  return "type-default";
});

function formatDate(dateStr?: string): string {
  if (!dateStr) return "Recent";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 7) return `${diffDays}d ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)}w ago`;
    if (diffDays <= 365) return `${Math.ceil(diffDays / 30)}mo ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}
</script>

<style lang="scss" scoped>
$color-accent: #00d4ff;

.news-article-card {
  display: block;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.3s ease;
  text-decoration: none;
  color: inherit;

  &:not(.disabled):hover {
    border-color: rgba($color-accent, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba($color-accent, 0.15);

    .article-title {
      color: $color-accent;
    }

    .read-more {
      transform: translateX(4px);
    }
  }

  &.disabled {
    cursor: default;
    opacity: 0.8;
  }
}

.article-content {
  padding: 16px;
}

.article-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
}

.article-type {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &.type-press {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
  }

  &.type-news {
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
  }

  &.type-announcement {
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
  }

  &.type-award {
    background: rgba(168, 85, 247, 0.2);
    color: #a855f7;
  }

  &.type-default {
    background: rgba(0, 212, 255, 0.2);
    color: $color-accent;
  }
}

.article-date {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap;
}

.article-title {
  margin: 0 0 10px 0;
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  line-height: 1.4;
  transition: color 0.3s ease;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-snippet {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.article-source {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);

  i {
    color: $color-accent;
  }
}

.read-more {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: $color-accent;
  font-weight: 500;
  transition: transform 0.3s ease;

  i {
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .article-content {
    padding: 14px;
  }

  .article-title {
    font-size: 14px;
  }

  .article-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
