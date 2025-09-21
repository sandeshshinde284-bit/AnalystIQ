const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false, // ✅ Disable ESLint temporarily
  configureWebpack: {
    resolve: {
      fallback: {
        crypto: false,
        stream: false,
        assert: false,
        http: false,
        https: false,
        os: false,
        url: false,
        zlib: false,
      },
    },
  },
  devServer: {
    port: 8080,
    host: "localhost",
    https: false,
    open: true,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  productionSourceMap: false,
  css: {
    loaderOptions: {
      scss: {
        additionalData: `
          @import "@/styles/variables.scss";
          @import "@/styles/mixins.scss";
        `,
      },
    },
  },
});
