import { readFileSync } from "node:fs";
import { join } from "node:path";

export default function RoadmapPage() {
  const roadmap = readFileSync(join(process.cwd(), "docs", "ROADMAP_BLOCKS.md"), "utf8");

  return (
    <main>
      <h1>Этапы проекта</h1>
      <pre>{roadmap}</pre>
    </main>
  );
}
