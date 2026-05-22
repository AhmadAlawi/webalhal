"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  addProviderVehicle,
  deleteProviderVehicle,
  getMyTransportProvider,
  getProviderVehicles,
  type TransportVehicle,
} from "@/services/transport";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";
import { Plus, Trash2 } from "lucide-react";

export default function TransportVehiclesPage() {
  const { user, requireAuth } = useAuth();
  const [providerId, setProviderId] = useState<number | null>(null);
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [vehicleType, setVehicleType] = useState("");
  const [model, setModel] = useState("");
  const [capacity, setCapacity] = useState("");
  const [pricePerKm, setPricePerKm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async (pid: number) => {
    const list = await getProviderVehicles(pid);
    setVehicles(list);
  };

  useEffect(() => {
    if (!requireAuth() || !user?.userId) return;
    getMyTransportProvider(user.userId)
      .then((p) => {
        if (p) {
          setProviderId(p.transportProviderId);
          return load(p.transportProviderId);
        }
      })
      .finally(() => setLoading(false));
  }, [requireAuth, user?.userId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!providerId || !vehicleType.trim() || !model.trim()) {
      setError("أدخل نوع المركبة والموديل");
      return;
    }
    setError("");
    try {
      await addProviderVehicle(providerId, {
        vehicleType: vehicleType.trim(),
        model: model.trim(),
        capacity: capacity.trim() || undefined,
        pricePerKm: pricePerKm ? Number(pricePerKm) : undefined,
      });
      setShowForm(false);
      setVehicleType("");
      setModel("");
      setCapacity("");
      setPricePerKm("");
      await load(providerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل الإضافة");
    }
  }

  async function handleDelete(v: TransportVehicle) {
    if (!providerId) return;
    const vid = v.vehicleId ?? v.transportVehicleId;
    if (!vid || !confirm("حذف هذه المركبة؟")) return;
    try {
      await deleteProviderVehicle(providerId, vid);
      await load(providerId);
    } catch {
      setError("فشل الحذف");
    }
  }

  if (user?.roleId !== UserRole.Transport) {
    return <PageContainer className="py-16 text-center text-red-600">للناقلين فقط</PageContainer>;
  }

  return (
    <>
      <PageHeader title="مركباتي" backHref="/transport/hub" />
      <PageContainer className="py-8">
        {loading ? (
          <p className="text-center text-slate-500">جاري التحميل...</p>
        ) : !providerId ? (
          <div className="text-center">
            <p className="mb-4 text-slate-600">سجّل كمزود نقل أولاً</p>
            <Link href="/transport/register">
              <Button>تسجيل ناقل</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 flex justify-end">
              <Button size="sm" onClick={() => setShowForm((s) => !s)}>
                <Plus className="h-4 w-4" />
                مركبة جديدة
              </Button>
            </div>

            {showForm && (
              <form
                onSubmit={handleAdd}
                className="mb-8 space-y-4 rounded-2xl border bg-white p-6 shadow-sm"
              >
                <Input label="نوع المركبة" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} />
                <Input label="الموديل" value={model} onChange={(e) => setModel(e.target.value)} />
                <Input label="السعة" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
                <Input
                  label="سعر/كم"
                  type="number"
                  value={pricePerKm}
                  onChange={(e) => setPricePerKm(e.target.value)}
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" fullWidth>
                  حفظ المركبة
                </Button>
              </form>
            )}

            <ul className="space-y-3">
              {vehicles.map((v, i) => (
                <li
                  key={v.vehicleId ?? v.transportVehicleId ?? i}
                  className="flex items-center justify-between rounded-xl border bg-white px-5 py-4"
                >
                  <div>
                    <p className="font-medium">{v.vehicleType || "مركبة"}</p>
                    <p className="text-sm text-slate-500">
                      {v.model}
                      {v.capacity ? ` · ${v.capacity}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(v)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
              {vehicles.length === 0 && (
                <li className="py-12 text-center text-slate-500">لا مركبات مسجّلة</li>
              )}
            </ul>
          </>
        )}
      </PageContainer>
    </>
  );
}
