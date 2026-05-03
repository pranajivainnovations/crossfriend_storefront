"use client"

import { useCallback, useState } from "react"
import type { DeliveryTimeSlot } from "@lib/types/product-contract"
import { formatDate, getEarliestDeliveryDate } from "@lib/util/delivery-utils"
import DeliveryDatePicker from "@modules/products/components/delivery-date-picker"

const MAX_MESSAGE_LENGTH = 50

type CakeCustomizerProps = {
  message: string
  deliveryDate: string
  deliveryTimeSlot: DeliveryTimeSlot | ""
  onMessageChange: (msg: string) => void
  onDeliveryDateChange: (date: string) => void
  onDeliveryTimeSlotChange: (slot: DeliveryTimeSlot) => void
}

export default function CakeCustomizer({
  message,
  deliveryDate,
  deliveryTimeSlot,
  onMessageChange,
  onDeliveryDateChange,
  onDeliveryTimeSlotChange,
}: CakeCustomizerProps) {
  const handleTimeSlotChange = useCallback(
    (slot: DeliveryTimeSlot) => {
      onDeliveryTimeSlotChange(slot)
    },
    [onDeliveryTimeSlotChange]
  )

  return (
    <div className="flex flex-col gap-5 p-4 rounded-xl bg-cf-warm/60 border border-cf-orange/10">
      <div className="flex items-center gap-2">
        <span className="text-lg">🎂</span>
        <h3 className="font-heading font-semibold text-sm text-grey-80">
          Customize Your Cake
        </h3>
      </div>

      {/* Custom message on cake */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-grey-80">
          ✍️ Message on Cake
          <span className="text-xs text-ui-fg-muted ml-1">(optional)</span>
        </label>
        <input
          type="text"
          value={message}
          onChange={(e) => {
            if (e.target.value.length <= MAX_MESSAGE_LENGTH) {
              onMessageChange(e.target.value)
            }
          }}
          placeholder="e.g. Happy Birthday Priya!"
          className="w-full px-3 py-2.5 rounded-lg border border-ui-border-base bg-white text-sm text-grey-80 placeholder:text-ui-fg-muted focus:outline-none focus:ring-2 focus:ring-cf-orange/40 focus:border-cf-orange transition-colors"
          maxLength={MAX_MESSAGE_LENGTH}
        />
        <span className="text-[10px] text-ui-fg-muted text-right">
          {message.length}/{MAX_MESSAGE_LENGTH}
        </span>
      </div>

      {/* Delivery date & time */}
      <DeliveryDatePicker
        date={deliveryDate}
        timeSlot={deliveryTimeSlot}
        onDateChange={onDeliveryDateChange}
        onTimeSlotChange={handleTimeSlotChange}
      />
    </div>
  )
}
