<template>
  <footer class="page-footer">
    <div class="page-footer-grid">
      <div class="page-footer-grid__info">
        <div class="page-footer-info__message">
          <p class="page-footer-message__headline">
            <span>Author: &nbsp;</span>
            <PageFooterHyperlink path="https://www.linkedin.com/in/joel-w-hogg"
              >Joel Hogg</PageFooterHyperlink
            >
          </p>
        </div>
        <div class="page-footer-info__resource-list">
          <div
            v-bind:key="resource.path"
            v-for="resource in resourceList"
            class="page-footer-info__resource-list-item"
          >
            <PageFooterHyperlink :path="resource.path">
              {{ resource.label }}
            </PageFooterHyperlink>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import PageFooterHyperlink from "@/components/page-footer-hyperlink.vue";

const resourceList = [
  {
    label: "Get in touch: joelhogg45@gmail.com",
  },
];
</script>
