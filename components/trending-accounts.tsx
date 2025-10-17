import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, TrendingUp } from "lucide-react"
import Link from "next/link"

const accounts = [
  {
    id: "pjsk-001",
    level: "Rank 250",
    price: "$180",
    rating: 4.9,
    features: ["50+ 4★ Cards", "Limited Miku", "10M+ Crystals"],
    image: "/project-sekai-account-1.jpg",
  },
  {
    id: "pjsk-002",
    level: "Rank 180",
    price: "$320",
    rating: 5.0,
    features: ["All Limited Cards", "Master FC", "Rare Costumes"],
    image: "/project-sekai-account-2.jpg",
  },
  {
    id: "pjsk-003",
    level: "Rank 120",
    price: "$95",
    rating: 4.8,
    features: ["30+ 4★ Cards", "Event Cards", "5M Crystals"],
    image: "/project-sekai-account-3.jpg",
  },
]

export function TrendingAccounts() {
  return (
    <section className="relative z-10 container mx-auto px-4 py-20">
      <div className="space-y-4 text-center mb-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-2 text-sm font-medium text-secondary">
          <TrendingUp className="h-4 w-4" />
          Hot Deals
        </div>
        <h2 className="font-bold text-4xl md:text-5xl text-balance text-foreground">Featured Accounts</h2>
        <p className="text-lg text-muted-foreground text-pretty">Premium Project Sekai accounts at great prices</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account, index) => (
          <Card
            key={index}
            className="group overflow-hidden border-border hover:border-primary transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 bg-card"
          >
            <CardContent className="p-0">
              <div className="relative overflow-hidden">
                <img
                  src={account.image || "/placeholder.svg"}
                  alt="Project Sekai account"
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <Badge className="absolute top-3 left-3 bg-secondary text-secondary-foreground">{account.level}</Badge>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xl text-foreground">Project Sekai</h3>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span className="text-sm font-medium text-foreground">{account.rating}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {account.features.map((feature) => (
                    <Badge key={feature} variant="outline" className="text-xs border-primary/30 text-foreground">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-6 pt-0 flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Price</div>
                <div className="font-bold text-2xl text-primary">{account.price}</div>
              </div>
              <Link href={`/account/${account.id}`}>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">View Details</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  )
}
