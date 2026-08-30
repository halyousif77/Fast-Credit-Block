

"use client";
import {
  Truck,
  FileText,
  Calendar,
  AlertTriangle,
  Clock3,
  BadgeDollarSign,
} from "lucide-react";
type Props = {
  vanCode: string;
  data: any[];
};

export default function WhatsAppReport({
  vanCode,
  data,
}: Props) {
  const totalAmount = data.reduce(
    (sum, row) =>
      sum +
      Number(
        row["Credit Invoice Amount"] || 0
      ),
    0
  );

  const oldestDays = Math.max(
    ...data.map(
      (row) =>
        Number(
          row["Credit_Days"] || 0
        )
    ),
    0
  );

  const totalRejected = data.reduce(
    (sum, row) =>
      sum +
      Number(
        row["Total Rejected Count"] || 0
      ),
    0
  );

  return (
    <div
      id="whatsapp-report"
      style={{
        width: "1400px",
        background: "#ffffff",
        padding: "10px",
        fontFamily: "Arial",
      }}
    >
<div
  style={{
    display: "flex",
    border: "1px solid #d7dce5",
    borderRadius: "4px",
    overflow: "hidden",
  }}
>
  {/* Left Side */}
<div
  style={{
    background: "#0b2668",
    color: "#fff",
    padding: "8px 12px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: "330px",
  }}
>
    <div
      style={{
        width: "38px",
        height: "38px",
        borderRadius: "50%",
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "2px solid #d9d9d9",
      }}
    >
      <Truck
        size={18}
        color="#0b2668"
      />
    </div>

    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        

        <span
          style={{
            fontSize: "20px",
            fontWeight: 700,
          }}
        >
          CREDIT BLOCK REPORT
        </span>
      </div>

      <div
        style={{
          fontSize: "13px",
          marginTop: "2px",
        }}
      >
        Van Code: {vanCode}
      </div>
    </div>
  </div>

  {/* Right Side Stats */}
<div
  style={{
    flex: 1,
    background: "#ffffff",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    padding: "0 16px",
  }}
>
    <MiniStat
      icon={
        <FileText
          size={16}
          color="#60a5fa"
        />
      }
      title="Total Invoices"
      value={data.length}
    />

    <MiniStat
      icon={
        <BadgeDollarSign
          size={16}
          color="#4ade80"
        />
      }
      title="Total Credit Amount"
      value={totalAmount.toLocaleString()}
    />

    <MiniStat
      icon={
        <Clock3
          size={16}
          color="#93c5fd"
        />
      }
      title="Oldest Credit Days"
      value={oldestDays}
    />

    <MiniStat
      icon={
        <AlertTriangle
          size={16}
          color="#f87171"
        />
      }
      title="Total Rejected"
      value={totalRejected}
    />

<div
  style={{
    background: "#0b2668",
    color: "#fff",
    padding: "12px 14px",
    minWidth: "110px",
    textAlign: "center",
  }}
>
  <div
    style={{
      fontSize: "10px",
    }}
  >
    Date
  </div>

  <div
    style={{
      fontSize: "18px",
      fontWeight: 700,
    }}
  >
    {new Date().toLocaleDateString()}
  </div>
</div>
  </div>
</div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr
            style={{
              background: "#0b2668",
              color: "#fff",
            }}
          >
            <th style={th}>Van Code.</th>
            <th style={th}>Customer Code</th>
            <th style={th}>Customer Name</th>
            <th style={th}>Payment Term</th>
            <th style={th}>Invoice #</th>
            <th style={th}>Trx Date</th>
            <th style={th}>Pending CIM</th>
            <th style={th}>Credit_Days</th>
            <th style={th}>Total Rejected Count</th>
          </tr>
        </thead>

        <tbody>
          {data.map((row, index) => (
            <tr
              key={index}
              style={{
                background:
                  index % 2 === 0
                    ? "#ffffff"
                    : "#f3f4f6",
              }}
            >
              <td style={td}>
                {row["Van Code."]}
              </td>

              <td style={td}>
                {row["Customer Code"]}
              </td>

              <td style={td}>
                {row["Customer Name"]}
              </td>

              <td style={td}>
                {row["Payment Term"]}
              </td>

              <td style={td}>
                {row["Invoice #"]}
              </td>

<td style={td}>
  {row["Trx Date"]
    ? new Date(
        (Number(row["Trx Date"]) - 25569) *
          86400 *
          1000
      ).toLocaleDateString("en-GB")
    : ""}
</td>

              <td style={td}>
                {row["Pending CIM"]}
              </td>

              <td style={td}>
                {row["Credit_Days"]}
              </td>

              <td style={td}>
                {row["Total Rejected Count"]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div
        style={{
          marginTop: "6px",
          background: "#0b2668",
          color: "#fff",
          padding: "8px 14px",
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          borderRadius: "4px",
        }}
      >
        <span>
          Note: Only active block invoices
          are included.
        </span>

        <span>
          Page 1 of 1
        </span>
      </div>
    </div>
  );
}

function MiniStat({
  icon,
  title,
  value,
}: any) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
      }}
    >
      {icon}

      <div>
        <div
          style={{
            fontSize: "10px",
            color: "#4b5563",
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: "17px",
            fontWeight: 700,
            color: "#0b2668",
            lineHeight: 1.1,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

const th = {
  padding: "8px",
  border: "1px solid #d3dae4",
  textAlign: "left" as const,
  fontSize: "12px",
  fontWeight: 700,
};

const td = {
  padding: "8px",
  border: "1px solid #e2e8f0",
  fontSize: "11px",
  color: "#1e293b",
};