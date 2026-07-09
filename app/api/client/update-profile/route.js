import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const data = await req.json();
    const { email, name, mobile, password } = data;

    if (!email) {
      return Response.json({ success: false, message: "Email is required to identify user" }, { status: 400 });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (mobile) updateData.mobile = mobile;
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: updateData
    });

    return Response.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        mobile: updatedUser.mobile
      }
    });

  } catch (error) {
    console.error("Update Profile Error:", error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
