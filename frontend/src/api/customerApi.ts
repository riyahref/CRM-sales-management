import { apiFetch } from "./client";
import type {
  CustomerDetailResponse,
  ContactPerson,
  ContactPersonCreateRequest,
  Activity,
  ActivityCreateRequest
} from "../types/customer";

export async function getCustomerDetail(id: number): Promise<CustomerDetailResponse> {
  return apiFetch<CustomerDetailResponse>(`/customers/${id}`);
}

export async function addContactPerson(
  customerId: number,
  body: ContactPersonCreateRequest
): Promise<ContactPerson> {
  return apiFetch<ContactPerson>(`/customers/${customerId}/contacts`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function logCustomerActivity(
  customerId: number,
  body: ActivityCreateRequest
): Promise<Activity> {
  return apiFetch<Activity>(`/customers/${customerId}/activities`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}
