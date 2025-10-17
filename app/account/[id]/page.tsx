import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Product } from "@/lib/firebaseClient";
import { AccountDetailClient } from "@/components/account-detail-client";
import { getProductByCode } from "@/lib/serverActions";

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const account = await getProductByCode(id);

  if (!account) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 mt-20">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{account.name}</span>
        </div>

        <AccountDetailClient account={account} />

        {/* Description & Features */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardContent className="p-6">
                <h2 className="font-bold text-2xl mb-4 text-foreground">
                  Mô tả
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {account.description}
                </p>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h2 className="font-bold text-2xl mb-4 text-foreground">
                  Chi tiết
                </h2>
                <div className="space-y-3">
                  {account.specifications.map((spec: any) => (
                    <div
                      key={spec.label}
                      className="flex justify-between items-center py-2 border-b border-border last:border-0"
                    >
                      <span className="text-muted-foreground">
                        {spec.label}
                      </span>
                      <span className="font-semibold text-foreground">
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
