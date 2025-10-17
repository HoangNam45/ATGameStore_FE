"use client";

import { Button } from "@/components/ui/button";
import {
  Menu,
  User,
  LogOut,
  Settings,
  X,
  Home,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { isOwnerEmail } from "@/lib/firebaseClient";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  const { user, userProfile, loading, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const getUserInitials = () => {
    if (userProfile?.username) {
      return userProfile.username.slice(0, 2).toUpperCase();
    }
    if (user?.displayName) {
      return user.displayName.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const isUserOwner = user ? isOwnerEmail(user.email || "") : false;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2"
              onClick={closeMobileMenu}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl">
                {"AT"}
              </div>
              <span className="font-bold text-xl text-foreground">
                QTAT SHOP
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {loading ? (
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            ) : user ? (
              // Authenticated user UI
              <div className="flex items-center gap-3">
                <span className="hidden md:block text-sm text-muted-foreground">
                  Xin chào,{" "}
                  {userProfile?.username || user.displayName || "User"}!
                </span>

                {/* Desktop dropdown menu */}
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative cursor-pointer h-10 w-10 rounded-full"
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={user.photoURL || ""}
                            alt="User avatar"
                          />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-56"
                      align="end"
                      forceMount
                    >
                      <div className="flex flex-col space-y-1 p-2">
                        <p className="text-sm font-medium leading-none">
                          {userProfile?.username || user.displayName || "User"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                      <DropdownMenuSeparator />
                      {/* <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        <span>Hồ sơ cá nhân</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <span>Đơn hàng của tôi</span>
                      </DropdownMenuItem> */}
                      {isUserOwner && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href="/owner/dashboard">
                              <span>Quản lý tài khoản</span>
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="text-destructive"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Đăng xuất</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Mobile avatar and menu button */}
                <div className="flex items-center gap-2 md:hidden">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || ""} alt="User avatar" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-foreground h-8 w-8"
                    onClick={() => setIsMobileMenuOpen(true)}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ) : (
              // Non-authenticated user UI
              <>
                <Link href="/register" className="hidden md:block">
                  <Button
                    variant="outline"
                    className="text-foreground cursor-pointer"
                  >
                    Đăng ký
                  </Button>
                </Link>
                <Link href="/login" className="hidden md:block">
                  <Button className="bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90">
                    <User className="mr-2 h-4 w-4" />
                    Đăng nhập
                  </Button>
                </Link>

                {/* Mobile menu button for non-authenticated users */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-foreground md:hidden"
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-80 max-w-[85vw] bg-card shadow-xl transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                {"AT"}
              </div>
              <span className="font-bold text-lg text-foreground">
                QTAT SHOP
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeMobileMenu}
              className="text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : user ? (
              // Authenticated user content
              <div className="space-y-6">
                {/* User Info */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.photoURL || ""} alt="User avatar" />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none truncate">
                      {userProfile?.username || user.displayName || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground mt-1 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="space-y-2">
                  <Link
                    href="/"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                  >
                    <Home className="h-5 w-5 text-muted-foreground" />
                    <span className="text-foreground">Trang chủ</span>
                  </Link>

                  <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors w-full text-left">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <span className="text-foreground">Hồ sơ cá nhân</span>
                  </button>

                  <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors w-full text-left">
                    <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                    <span className="text-foreground">Đơn hàng của tôi</span>
                  </button>

                  {isUserOwner && (
                    <Link
                      href="/owner/dashboard"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <span className="text-foreground">Quản lý tài khoản</span>
                    </Link>
                  )}
                </nav>

                {/* Sign Out Button */}
                <div className="pt-4 border-t border-border/50">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-destructive/10 transition-colors w-full text-left text-destructive"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            ) : (
              // Non-authenticated user content
              <div className="space-y-4">
                <div className="text-center py-8">
                  <div className="flex justify-center mb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-2xl">
                      {"AT"}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Chào mừng đến QTAT SHOP
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Đăng nhập để trải nghiệm đầy đủ tính năng
                  </p>
                </div>

                <div className="space-y-3">
                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className="block"
                  >
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      <User className="mr-2 h-4 w-4" />
                      Đăng nhập
                    </Button>
                  </Link>

                  <Link
                    href="/register"
                    onClick={closeMobileMenu}
                    className="block"
                  >
                    <Button
                      variant="outline"
                      className="w-full text-foreground"
                    >
                      Đăng ký
                    </Button>
                  </Link>
                </div>

                {/* Navigation for non-authenticated users */}
                <div className="pt-4 border-t border-border/50">
                  <nav className="space-y-2">
                    <Link
                      href="/"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <Home className="h-5 w-5 text-muted-foreground" />
                      <span className="text-foreground">Trang chủ</span>
                    </Link>
                  </nav>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
