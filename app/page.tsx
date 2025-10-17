import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { FeaturedGames } from "@/components/featured-games";

// import { TrendingAccounts } from "@/components/trending-accounts";
import { Footer } from "@/components/footer";
import { SakuraPetals } from "@/components/sakura-petals";

export default function HomePage() {
  return (
    <>
      <Header />
      <div className="relative min-h-screen overflow-hidden">
        <SakuraPetals />

        <main>
          <HeroSection />
          <FeaturedGames />

          {/* <TrendingAccounts /> */}
        </main>
        <Footer />
      </div>
    </>
  );
}
