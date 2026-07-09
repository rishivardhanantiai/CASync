import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const email = searchParams.get("email");

    if (!email) {
      return Response.json({ success: false, message: "Email required" }, { status: 400 });
    }

    const companies = await prisma.companyRegistration.findMany({
      where: {
        userEmail: email,
        companyName: {
          contains: search || "",
          mode: "insensitive"
        }
      }
    });

    return Response.json({ success: true, data: companies });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
