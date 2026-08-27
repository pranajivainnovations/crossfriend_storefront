"use client"

import { Spinner, Trash } from "@medusajs/icons"
import { clx } from "@medusajs/ui"
import { useState } from "react"

import { track, type AnalyticsItem } from "@lib/analytics"
import { deleteLineItem } from "@modules/cart/actions"

const DeleteButton = ({
  id,
  children,
  className,
  analytics,
}: {
  id: string
  children?: React.ReactNode
  className?: string
  /**
   * What was removed, for remove_from_cart. Optional: this button is used in places that have no
   * line item to describe, and a removal reported with no item is worse than one not reported —
   * it shows up in reports as an anonymous event nobody can act on.
   */
  analytics?: { currency: string; value: number; items: AnalyticsItem[] }
}) => {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (id: string) => {
    setIsDeleting(true)
    await deleteLineItem(id)
      .then(() => {
        // After the delete lands, matching add_to_cart — a failed removal that still reported would
        // make the cart look emptier than it is.
        if (analytics) track("remove_from_cart", analytics)
      })
      .catch((err) => {
        setIsDeleting(false)
      })
  }

  return (
    <div
      className={clx(
        "flex items-center justify-between text-small-regular",
        className
      )}
    >
      <button
        className="flex gap-x-1 text-ui-fg-subtle hover:text-ui-fg-base cursor-pointer"
        onClick={() => handleDelete(id)}
      >
        {isDeleting ? <Spinner className="animate-spin" /> : <Trash />}
        <span>{children}</span>
      </button>
    </div>
  )
}

export default DeleteButton
