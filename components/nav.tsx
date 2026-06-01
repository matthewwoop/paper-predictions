"use client"

import Link from 'next/link'
import { useAuth, useUser, SignInButton, SignOutButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'

export function Nav() {
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  const email = user?.emailAddresses[0]?.emailAddress

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left group */}
          <div className="flex items-center">
            <Link href="/" className="text-lg font-bold tracking-tight">
              Paper Predictions
            </Link>
          </div>

          {/* Center group — hidden on mobile */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Markets
            </Link>
            {isSignedIn && (
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>
            )}
          </nav>

          {/* Right group */}
          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <>
                {email && (
                  <span className="hidden sm:block text-xs text-muted-foreground">
                    {email}
                  </span>
                )}
                <SignOutButton>
                  <Button variant="ghost" size="sm">
                    Sign Out
                  </Button>
                </SignOutButton>
              </>
            ) : (
              <SignInButton mode="modal">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
