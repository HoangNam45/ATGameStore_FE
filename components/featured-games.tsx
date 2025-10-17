import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";

const categories = [
  {
    name: "Tài Khoản Có Sẵn",

    image: "/project-sekai-four-star-cards.jpg",
    tag: "Popular",
    href: "/products/available",
  },
  {
    name: "Tài Khoản Đặt Trước",

    image: "/project-sekai-limited-cards.jpg",
    tag: "Rare",
    href: "/products/preorder",
  },
];

export function FeaturedGames() {
  return (
    <section className="relative z-10 mx-auto px-4 py-20 max-w-6xl">
      {/* <div className="space-y-4 text-center mb-12">
        <h2 className="font-bold text-2xl md:text-3xl text-balance text-foreground">
          Các Loại Acc Project Sekai
        </h2>
      </div> */}

      <div
        className="mx-auto grid gap-6"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          justifyContent: "center",
        }}
      >
        {categories.map((category) => (
          <Link key={category.name} href={category.href}>
            <Card className="group overflow-hidden border-border hover:border-primary transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 cursor-pointer bg-card w-full h-full flex flex-col">
              <CardContent className="p-0">
                <div className="relative overflow-hidden">
                  <Image
                    width={400}
                    height={192}
                    src={category.image || "/placeholder.svg"}
                    alt={category.name}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
                    {category.tag}
                  </Badge>
                </div>
                <div className="p-6 space-y-2 flex-1 flex flex-col justify-between">
                  <h3 className="font-bold text-xl text-foreground">
                    {category.name}
                  </h3>
                  {/* <p className="text-sm text-muted-foreground">
                   accounts available
                  </p> */}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
