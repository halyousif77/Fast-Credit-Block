import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const webpush = require("web-push");

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);


export async function GET() {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("region");

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {

    const body = await req.json();

const users = body.users;

const uploadedBy =
  body.uploadedBy || "Unknown";

    const deleteResult =
      await supabase
        .from("users")
        .delete()
        .neq("id", 0);

    console.log(
      "DELETE RESULT",
      deleteResult
    );

    const insertResult =
      await supabase
        .from("users")
        .insert(users);

    console.log(
      "INSERT RESULT",
      insertResult
    );

    if (insertResult.error) {

      return NextResponse.json(
        {
          error:
            insertResult.error.message,
        },
        {
          status: 500,
        }
      );

    }
const { data: user } = await supabase
  .from("app_users")
  .select("full_name")
  .eq("username", uploadedBy)
  .single();

await supabase
  .from("notifications")
  .insert({
    username: null,
    title: "👥 Users Imported",
    message: `${users.length} users imported successfully by ${user?.full_name || uploadedBy}.`,
  });

const { data: adminSubscriptions } =
  await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("van_code", "ADMIN");

await Promise.all(
  (adminSubscriptions || []).map(
    async (row: any) => {
      const subscription =
        typeof row.subscription === "string"
          ? JSON.parse(row.subscription)
          : row.subscription;

      try {
        await webpush.sendNotification(
          subscription,
          JSON.stringify({
            title: "👥 Users File Imported",
            body: `${user?.full_name || uploadedBy} has successfully imported ${users.length} users.`,
            url: "https://credit-dashboard-fawn.vercel.app/van",
          })
        );
      } catch (error) {
        console.error(
          "Admin users import push failed:",
          error
        );
      }
    }
  )
);
    return NextResponse.json({
      success: true
    });

  } catch (error: any) {

    console.log(
      "FULL ERROR",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Import Failed",
      },
      {
        status: 500,
      }
    );

  }
}
export async function PUT(req: Request) {

  const body = await req.json();

  const { error } =
    await supabase
      .from("users")
      .update({
        region: body.region,
        city: body.city,
        organization_code:
          body.organization_code,
        user_code:
          body.user_code,
        organization_name:
          body.organization_name,
        van_sub_inventory:
          body.van_sub_inventory,
        contact:
          body.contact,
      })
      .eq("id", body.id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true
  });

}

export async function DELETE(
  req: Request
) {

  const { id } =
    await req.json();

  const { error } =
    await supabase
      .from("users")
      .delete()
      .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true
  });

}