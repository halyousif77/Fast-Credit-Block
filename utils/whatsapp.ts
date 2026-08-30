export const formatWhatsAppNumber = (
  phone: string
) => {

  const clean = String(phone || "")
    .replace(/\D/g, "");

  if (!clean) {
    return "";
  }

  if (clean.startsWith("05")) {
    return `966${clean.slice(1)}`;
  }

  if (clean.startsWith("5")) {
    return `966${clean}`;
  }

  if (clean.startsWith("966")) {
    return clean;
  }

  return clean;
};

export const getVanUser = async (
  vanCode: string
) => {

  const response =
    await fetch("/api/users");

  const users =
    await response.json();

  const user = users.find(
    (item: any) =>
      String(
        item.van_sub_inventory || ""
      )
        .trim()
        .toUpperCase() ===
      String(vanCode)
        .trim()
        .toUpperCase()
  );

  return user || null;
};

export const getVanWhatsAppNumber =
  async (
    vanCode: string
  ) => {

    const user =
      await getVanUser(vanCode);

    if (!user) {
      return "";
    }

    return formatWhatsAppNumber(
      user.contact
    );
  };

export const openWhatsApp =
  async (
    vanCode: string,
    message: string = ""
  ) => {

    const phone =
      await getVanWhatsAppNumber(
        vanCode
      );

    if (!phone) {
      alert(
        `No contact found for ${vanCode}`
      );
      return;
    }

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(
        message
      )}`,
      "_blank"
    );
  };