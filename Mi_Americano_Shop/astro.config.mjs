import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import node from "@astrojs/node";
import clerk from "@clerk/astro";
import { neobrutalism } from '@clerk/themes'
import { esES } from '@clerk/localizations'

export default defineConfig({
  integrations: [clerk(
    {
      localization: esES,
      appearance: {
        baseTheme: neobrutalism,
      },
    }
  ), tailwind()],
  adapter: node({ mode: "standalone" }),
  output: "server",
});
