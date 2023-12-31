module.exports = {
  packagerConfig: {
    asar: true,
  },
  rebuildConfig: {},
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "github-user-name",
          name: "github-repo-name",
        },
        prerelease: false,
        draft: true,
      },
    },
  ],
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        authors: "Tom Bradley",
        description: "A simple markdown editor.",
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
      config: {
        authors: "Tom Bradley",
        description: "A simple markdown editor.",
      },
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        authors: "Tom Bradley",
        description: "A simple markdown editor.",
      },
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {
        authors: "Tom Bradley",
        description: "A simple markdown editor.",
      },
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
  ],
};
