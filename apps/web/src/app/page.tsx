import Link from "next/link";
import { loadLandingPage, loadContentByType } from "@/lib/content";

export default function Home() {
  // Load Estonian content (default language)
  const landing = loadLandingPage("et");
  const performances = loadContentByType("et", "performance").slice(0, 6);

  if (!landing) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Content not found</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-indigo-900" />

        <div className="relative z-10 flex h-full items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-6xl md:text-8xl font-bold mb-6">
              {landing.frontmatter.title}
            </h1>
            {landing.frontmatter.description && (
              <p className="text-xl md:text-2xl max-w-2xl mx-auto opacity-90">
                {landing.frontmatter.description}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Featured Performances */}
      {performances.length > 0 && (
        <section className="py-20 px-4 md:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold mb-12 text-center">Etendused</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {performances.map((perf) => (
                <Link key={perf.slug} href={`/et/${perf.slug}`} className="group block">
                  <article className="overflow-hidden rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300 bg-white">
                    <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-purple-200 to-indigo-200" />
                    <div className="p-6">
                      <h3 className="text-2xl font-semibold mb-2 group-hover:text-purple-600 transition-colors">
                        {perf.frontmatter.title}
                      </h3>
                      {perf.frontmatter.description && (
                        <p className="text-gray-600 line-clamp-3">
                          {perf.frontmatter.description}
                        </p>
                      )}
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
