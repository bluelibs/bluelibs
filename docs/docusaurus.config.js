module.exports = {
  title: "BlueLibs",
  tagline: "fast like a prototype — scalable like enterprise",
  url: "https://www.bluelibs.com",
  baseUrl: "/",
  favicon: "img/favicon.ico",
  organizationName: "facebook", // Usually your GitHub org/user name.
  projectName: "BlueLibsJS", // Usually your repo name.
  onBrokenLinks: "warn",
  plugins: ["docusaurus-plugin-sass"],
  themeConfig: {
    colorMode: {
      disableSwitch: true,
    },
    googleAnalytics: {
      trackingID: "UA-40568040-12",
    },
    algolia: {
      apiKey: "fc3ffd92e766ee16a3af53c0862f1e91",
      indexName: "bluelibs",
      searchParameters: {}, // Optional (if provided by Algolia)
    },
    navbar: {
      title: "",
      logo: {
        alt: "BlueLibsJs",
        src: "img/logo.png",
      },
      items: [
        {
          to: "docs/",
          activeBasePath: "docs",
          label: "Docs",
          position: "left",
        },
        { to: "blog", label: "Blog", position: "left" }, // or position: 'right'
        {
          to: "excel2app/",
          activeBasePath: "excel2app",
          label: "Excel 2 App",
          position: "left",
        },
        // {
        //   href: "https://www.reddit.com/r/BlueLibs",
        //   label: "Reddit",
        //   position: "right",
        // },
        {
          href: "https://github.com/bluelibs/bluelibs",
          label: "GitHub",
          position: "right",
        },
        {
          href: "https://discord.gg/GmNeRDqxvp",
          label: "Discord",
          position: "right",
        },
      ],
    },
    footer: {
      style: "light",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Introduction",
              to: "docs/",
            },
            {
              label: "X-Framework",
              to: "docs/x-framework-introduction",
            },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "Stack Overflow",
              href: "https://stackoverflow.com/questions/tagged/bluelibs",
            },
            {
              label: "Discord",
              href: "https://discord.gg/GmNeRDqxvp",
            },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/bluelibs/bluelibs",
            },
            {
              label: "Newsletter",
              href: "http://eepurl.com/hcoxCj",
            },
            {
              label: "Feedback",
              href: "https://forms.gle/DTMg5Urgqey9QqLFA",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Theodor Diaconu.`,
    },
  },
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        docs: {
          // It is recommended to set document id as docs home page (`docs/` path).
          sidebarPath: require.resolve("./sidebars.js"),
          // Please change this to your repo.
          editUrl: "https://github.com/bluelibs/docs/edit/master",
        },
        theme: {
          disableSwitch: true,
          customCss: require.resolve("./src/css/main.scss"),
        },
        feedOptions: {
          type: "all",
          copyright: `Copyright © ${new Date().getFullYear()} BlueLibs DEVELOPMENT GROUP.`,
        },
      },
    ],
  ],
};
