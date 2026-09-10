"use server"

/**
 * Account server actions.
 *
 * signUp, logCustomerIn and updateCustomerPassword used to live here and are deliberately gone.
 * Sign-in is a mobile number and a one-time code; there is no password to set, change or check.
 *
 * They were already unreachable — the forms that called them were deleted — but an unreferenced
 * "use server" export is still an auth entry point sitting in the tree, one import away from being
 * wired back up. Leaving them would have made "removed, not hidden" true of the UI only. See
 * AUTH_PLAN.md.
 */

import {
  addShippingAddress,
  deleteShippingAddress,
  updateCustomer,
  updateShippingAddress,
} from "@lib/data"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { cookies, headers } from "next/headers"
import {
  StorePostCustomersCustomerAddressesAddressReq,
  StorePostCustomersCustomerAddressesReq,
  StorePostCustomersCustomerReq,
} from "@medusajs/medusa"

export async function updateCustomerName(
  _currentState: Record<string, unknown>,
  formData: FormData
) {
  const customer = {
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
  } as StorePostCustomersCustomerReq

  try {
    await updateCustomer(customer).then(() => {
      revalidateTag("customer")
    })
    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.toString() }
  }
}

export async function updateCustomerEmail(
  _currentState: Record<string, unknown>,
  formData: FormData
) {
  const customer = {
    email: formData.get("email"),
  } as StorePostCustomersCustomerReq

  try {
    await updateCustomer(customer).then(() => {
      revalidateTag("customer")
    })
    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.toString() }
  }
}

export async function updateCustomerPhone(
  _currentState: Record<string, unknown>,
  formData: FormData
) {
  const customer = {
    phone: formData.get("phone"),
  } as StorePostCustomersCustomerReq

  try {
    await updateCustomer(customer).then(() => {
      revalidateTag("customer")
    })
    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.toString() }
  }
}

export async function addCustomerShippingAddress(
  _currentState: Record<string, unknown>,
  formData: FormData
) {
  const customer = {
    address: {
      first_name: formData.get("first_name") as string,
      last_name: formData.get("last_name") as string,
      company: formData.get("company") as string,
      address_1: formData.get("address_1") as string,
      address_2: formData.get("address_2") as string,
      city: formData.get("city") as string,
      postal_code: formData.get("postal_code") as string,
      province: formData.get("province") as string,
      country_code: formData.get("country_code") as string,
      phone: formData.get("phone") as string,
    },
  } as StorePostCustomersCustomerAddressesReq

  try {
    await addShippingAddress(customer).then(() => {
      revalidateTag("customer")
    })
    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.toString() }
  }
}

export async function updateCustomerShippingAddress(
  currentState: Record<string, unknown>,
  formData: FormData
) {
  const addressId = currentState.addressId as string

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    company: formData.get("company") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
  } as StorePostCustomersCustomerAddressesAddressReq

  try {
    await updateShippingAddress(addressId, address).then(() => {
      revalidateTag("customer")
    })
    return { success: true, error: null, addressId }
  } catch (error: any) {
    return { success: false, error: error.toString(), addressId }
  }
}

export async function deleteCustomerShippingAddress(addressId: string) {
  try {
    await deleteShippingAddress(addressId).then(() => {
      revalidateTag("customer")
    })
    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.toString() }
  }
}

export async function updateCustomerBillingAddress(
  _currentState: Record<string, unknown>,
  formData: FormData
) {
  const customer = {
    billing_address: {
      first_name: formData.get("billing_address.first_name"),
      last_name: formData.get("billing_address.last_name"),
      company: formData.get("billing_address.company"),
      address_1: formData.get("billing_address.address_1"),
      address_2: formData.get("billing_address.address_2"),
      city: formData.get("billing_address.city"),
      postal_code: formData.get("billing_address.postal_code"),
      province: formData.get("billing_address.province"),
      country_code: formData.get("billing_address.country_code"),
      phone: formData.get("billing_address.phone"),
    },
  } as StorePostCustomersCustomerReq

  try {
    await updateCustomer(customer).then(() => {
      revalidateTag("customer")
    })
    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.toString() }
  }
}

export async function signOut() {
  cookies().set("_medusa_jwt", "", {
    maxAge: -1,
  })
  revalidateTag("auth")
  revalidateTag("customer")
  redirect(`/account`)
}
