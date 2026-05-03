"use client"

import Link from "next/link"
import React from "react"

/**
 * Link component for CrossFriend storefront.
 * India-only — no country code prefix needed.
 * Future: when [region] routing is added, this will prepend the region (city/area).
 */
const LocalizedClientLink = ({
  children,
  href,
  ...props
}: {
  children?: React.ReactNode
  href: string
  className?: string
  onClick?: () => void
  passHref?: true
  [x: string]: any
}) => {
  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  )
}

export default LocalizedClientLink
