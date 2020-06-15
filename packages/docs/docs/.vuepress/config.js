module.exports = (ctx) => ({
  locales: {
    "/": {
      lang: "zh",
      title: "PlugBoard",
      description: "以插件为中心按需配置解决复杂业务",
    },
  },
  head: [["link", { rel: "icon", href: `/logo.png` }]],
  themeConfig: {
    smoothScroll: true,
    // sidebarDepth: 2,
    // displayAllHeaders: true,
    locales: {
      "/": {
        nav: require("./nav/zh"),
        sidebar: {
          "/guide/": getGuideSidebar("指南"),
        },
      },
    },
  },
  plugins: ["flowchart"],
});
function getGuideSidebar(groupA) {
  return [
    {
      title: groupA,
      collapsable: false,
      children: ["", "lifecycle", "config", "plugin"],
    },
  ];
}
