"use client";
import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function VanExceptionsPage() {
  const params = useParams();

  const token = String(params.van || "");
const [vanCode, setVanCode] = useState("");
const [exceptions, setExceptions] =
  useState<any[]>([]);

const [loaded, setLoaded] =
  useState(false);
    const [loggedIn, setLoggedIn] =
  useState(false);
  useEffect(() => {
    const load = async () => {
  const currentUser =
  await localStorage.getItem(
    "currentUser"
  );

setLoggedIn(!!currentUser);

const response =
  await fetch("/api/exceptions");
  const data =
    await response.json();

      const today = new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );

      const validExceptions =
        (data || []).filter(
          (item: any) => {

            if (item.permanent) {
              return true;
            }

            const tillDate =
              new Date(
                item.till_date
              );

            tillDate.setHours(
              0,
              0,
              0,
              0
            );

            return (
              tillDate >= today
            );
          }
        );

      const filtered = validExceptions.filter(
  (item: any) =>
    String(item.van_code || "")
      .trim()
      .toUpperCase() ===
    token.trim().toUpperCase()
);

setVanCode(token);

      setExceptions(filtered);

setTimeout(() => {
  setLoaded(true);
}, 0);
    };

    load();
  }, [token]);
  const calculateBusinessDays = (
    dateString: string
  ) => {
    if (!dateString) return 0;

    const today = new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const endDate =
      new Date(dateString);

    let count = 0;

    const current =
      new Date(today);

    while (
      current <= endDate
    ) {
      if (
        current.getDay() !== 5
      ) {
        count++;
      }

      current.setDate(
        current.getDate() + 1
      );
    }

    return count;
  };

  const legalCount = loaded
  ? exceptions.filter(
      x => x.permanent
    ).length
  : "-";

const temporaryCount = loaded
  ? exceptions.filter(
      x => !x.permanent
    ).length
  : "-";
      return (
    <div className="min-h-screen bg-slate-100 p-3">

      <div className="mb-4 flex justify-between items-center">

<Link
  href={`/van/${token}`}
  className="text-blue-600 text-sm"
>
  ← Back To Van
</Link>

</div>
      <div className="bg-[#071d5c] text-white rounded-xl p-4 mb-4">

        <h1 className="text-2xl font-bold">
          {vanCode}
        </h1>

        <div className="mt-3">
          <span
            className="
              inline-flex
              items-center
              px-4
              py-2
              rounded-full
              bg-red-600
              text-white
              text-sm
              font-semibold
            "
          >
            ⚠️ Exceptions
          </span>
        </div>

        {loaded && (
  <div className="mt-3 space-y-1 text-sm">

    <div>
      Total Exceptions: {exceptions.length}
    </div>

    <div>
      Temporary: {temporaryCount}
    </div>

    <div>
      Legal: {legalCount}
    </div>

  </div>
)}

      </div>

        <div className="space-y-3">

    {exceptions.map(
      (item, index) => {
  
            const daysLeft =
              calculateBusinessDays(
                item.till_date
              );

            return (
              <div
  key={index}
  className="
    relative
    overflow-hidden
    bg-white
    rounded-xl
    border
    border-orange-300
    shadow-sm
    p-4
    before:absolute
    before:inset-1
    before:rounded-lg
    before:border
    before:border-orange-100
    before:pointer-events-none
  "
>
  <div
    className="
      absolute
      right-4
      top-4
      text-orange-200
      opacity-30
      pointer-events-none
    "
  >
    <ShieldCheck size={60} />
  </div>
                <div className="font-bold text-red-700 text-base">
                  {item.invoice}
                </div>

                <div className="mt-2 font-medium">
                  {item.customer_name}
                </div>

                <div className="text-sm text-slate-500">
                  {item.customer_code}
                </div>

                <div className="mt-3 pt-3 border-t border-orange-100 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-500">
                      Employee:
                    </span>{" "}
                    {item.employee_name}
                  </div>

                  <div>
                    <span className="text-slate-500">
                      ID:
                    </span>{" "}
                    {item.ats_code}
                  </div>

                  <div>
                    <span className="text-slate-500">
                      Till Date:
                    </span>{" "}
                    {item.permanent
                      ? "-"
                      : item.till_date}
                  </div>

                  <div>
                    <span className="text-slate-500">
                      Expires In:
                    </span>{" "}

                    {item.permanent ? (
                      <span className="text-red-600 font-semibold">
                        Legal
                      </span>
                    ) : (
                      <span className="text-orange-600 font-semibold">
                        {daysLeft} Days
                      </span>
                    )}
                  </div>

                </div>

              </div>
            );
          }
        )}

      </div>
      


{exceptions.length === 0 && (
  <div className="bg-white p-6 rounded-xl text-center text-slate-500">
    No Exceptions Found
  </div>
)}
    </div>
  );
}