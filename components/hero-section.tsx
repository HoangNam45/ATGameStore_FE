export function HeroSection() {
  return (
    <section className="relative z-10 container mx-auto px-4 py-5">
      <div className="flex flex-col items-center justify-center gap-6 text-center">
        <div className="space-y-4 max-w-3xl">
          <h3 className="font-bold text-[20px] md:text-3xl lg:text-4xl text-balance text-foreground leading-tight">
            🌸Chào mọi người tới web của QTAT🌸
          </h3>
          <p className="text-lg md:text-xl text-muted-foreground text-pretty leading-relaxed">
            Web mình chủ yếu bán acc reroll Project Sekai ft. Hatsune Miku ^^
          </p>

          {/* <Button
            size="lg"
            variant="outline"
            className="text-lg px-8 w-full max-w-[400px] border-primary text-primary hover:bg-primary/10 bg-transparent mx-auto"
          >
            Sell Your Account
          </Button> */}
        </div>
      </div>
    </section>
  );
}
