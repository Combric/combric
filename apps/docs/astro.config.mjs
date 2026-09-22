import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

const configuredSite = process.env.COMBRIC_DOCS_SITE_URL;

export default defineConfig({
  integrations: [
    starlight({
      title: "Combric",
      description: "Package-first UI framework documentation",
      customCss: ["./src/styles/docs.css"],
      pagefind: false,
      social: [
        {
          icon: "github",
          label: "Combric on GitHub",
          href: "https://github.com/Combric/combric",
        },
      ],
      sidebar: [
        { label: "Overview", link: "/" },
        {
          label: "Getting Started",
          items: [
            { label: "Introduction", link: "/getting-started/" },
            { label: "Installation", link: "/getting-started/installation/" },
            { label: "Standard CSS", link: "/getting-started/standard-css/" },
            { label: "React", link: "/getting-started/react/" },
            { label: "Tailwind", link: "/getting-started/tailwind/" },
            {
              label: "CLI & Developer Experience",
              link: "/getting-started/cli/",
            },
          ],
        },
        {
          label: "Foundations",
          items: [
            { label: "Metriq", link: "/foundations/metriq/" },
            { label: "Colors", link: "/foundations/colors/" },
            { label: "Typography", link: "/foundations/typography/" },
            { label: "Spacing", link: "/foundations/spacing/" },
            { label: "Sizing", link: "/foundations/sizing/" },
            { label: "Borders & Radius", link: "/foundations/borders-radius/" },
            { label: "Focus", link: "/foundations/focus/" },
            { label: "Motion", link: "/foundations/motion/" },
            { label: "Layers", link: "/foundations/layers/" },
            { label: "Token API", link: "/foundations/token-api/" },
          ],
        },
        {
          label: "Layout",
          items: [
            { label: "Container", link: "/layout/container/" },
            { label: "Stack", link: "/layout/stack/" },
            { label: "Inline", link: "/layout/inline/" },
            { label: "Cluster", link: "/layout/cluster/" },
            { label: "Grid", link: "/layout/grid/" },
          ],
        },
        {
          label: "Components",
          items: [{ autogenerate: { directory: "components" } }],
        },
        { label: "Accessibility", link: "/accessibility/" },
        { label: "Playground", link: "/playground/" },
        {
          label: "Reference",
          items: [
            { label: "Packages", link: "/reference/packages/" },
            { label: "Support & versioning", link: "/reference/support/" },
            { label: "Source & issues", link: "/reference/source/" },
          ],
        },
      ],
    }),
    react(),
  ],
  output: "static",
  site: configuredSite,
});
