"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();

  function isActive(path: string) {
    return pathname === path;
  }

  return (
    <div className="border-r">
      <div className="p-4 py-8">
        <h1 className="text-sm font-bold">My Store Admin</h1>
      </div>
      <div className="p-2">
        <nav>
          <ul>
            <li className="space-y-2">
              <Link
                href="/products"
                className={cn(
                  "text-sm hover:bg-muted inline-flex p-1 px-2 rounded-md w-full",
                  isActive("/products") && "bg-muted",
                )}
              >
                Products
              </Link>
              <ul className="pl-4">
                <li>
                  <Link
                    href="/product-lists"
                    className={cn(
                      "text-sm hover:bg-muted inline-flex p-1 px-2 rounded-md w-full",
                      isActive("/product-lists") && "bg-muted",
                    )}
                  >
                    Product Lists
                  </Link>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
