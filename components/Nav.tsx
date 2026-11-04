"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function Nav() {
  const path = usePathname();
  const router = useRouter();
  const { user, ready, logout } = useAuth();
  const on = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  const links = [
    { href: "/", label: "빈 방 보기" },
    ...(user
      ? [
          { href: "/reservations", label: "내 예약" },
          { href: "/pets", label: "내 반려동물" },
        ]
      : []),
  ];

  return (
    <header className="nav">
      <div className="nav-in">
        <Link href="/" className="brand">
          꼬리별
        </Link>
        <nav aria-label="메뉴">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={on(l.href) ? "on" : ""}>
              {l.label}
            </Link>
          ))}
        </nav>
        <nav className="account" aria-label="계정">
          {!ready ? null : user ? (
            <>
              <Link href="/account" className="who">
                {user.name}님
              </Link>
              <button
                className="btn ghost sm"
                onClick={() => {
                  logout();
                  router.push("/");
                }}
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href="/signup" className="btn ghost sm">
                회원가입
              </Link>
              <Link href="/login" className="btn primary sm">
                로그인
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
