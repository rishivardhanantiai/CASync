import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAutoAssignment } from "@/lib/assignment";

function buildServiceRequestSnapshot(type, data) {
  const clientName = data.contactPerson || data.name || data.requiredName || data.companyName || data.contactPersonName || "";

  let panNumber = data.pan || data.panNo || null;
  let gstNumber = data.gstNumber || data.companyRegNo || data.registrationNo || null;
  let cinNumber = data.companyRegNo || data.cin || null;
  let udyamNumber = data.udyamNo || data.registrationNo || data.udhyamNo || null;
  const financialYear = data.financialYear || null;
  const financialMonth = data.financialMonth || data.month || null;

  if (type === "APPLY_NEW_GST") {
    gstNumber = null;
  }

  return {
    userEmail: data.userEmail || data.email || "",
    clientName,
    panNumber,
    gstNumber,
    cinNumber,
    udhyamNumber: udyamNumber,
    financialYear,
    financialMonth,
  };
}

export async function POST(req) {
  try {
    const { type, data } = await req.json();
    const requestSnapshot = buildServiceRequestSnapshot(type, data);
    const userEmail = requestSnapshot.userEmail;
    const clientName = requestSnapshot.clientName;

    const assignment = await getAutoAssignment(userEmail);

    let createdRecord = null;
    let serviceType = type; // e.g., "APPLY_NEW_GST", "ADD_COMPANY", etc.

    // Denormalization fields
    let panNo = requestSnapshot.panNumber;
    let gstNo = requestSnapshot.gstNumber;
    let cinNo = requestSnapshot.cinNumber;
    let udyamNo = requestSnapshot.udyamNumber;
    let fy = requestSnapshot.financialYear;
    let month = requestSnapshot.financialMonth;

    switch (type) {
      case "APPLY_NEW_GST": {
        // Save in GSTRegistration table with empty gstNumber
        createdRecord = await prisma.gSTRegistration.create({
          data: {
            userEmail,
            firmName: data.requiredName || data.businessToStart || "",
            businessType: data.businessToStart || "",
            mainPerson: data.contactPerson || "",
            address: data.address || "",
            panNo: data.panNo || "",
            udyamNo: data.mobileNo || "", // Map mobile here for safety
            documents: data.documents || []
          }
        });
        gstNo = null; // since it's a new registration
        break;
      }
      case "ADD_COMPANY": {
        createdRecord = await prisma.companyRegistration.create({
          data: {
            userEmail,
            companyRegNo: data.companyRegNo || "",
            companyName: data.companyName || "",
            contactPerson: data.contactPerson || "",
            email: data.email || "",
            phone: data.phone || "",
            isNewRegistration: false,
            documents: data.documents || []
          }
        });
        cinNo = data.companyRegNo;
        break;
      }
      case "NEW_COMPANY_REGISTRATION": {
        createdRecord = await prisma.companyRegistration.create({
          data: {
            userEmail,
            companyName: data.requiredName || "",
            contactPerson: data.contactPerson || "",
            address: data.address || "",
            phone: data.mobileNo || "",
            email: data.emailId || "",
            businessToStart: data.businessToStart || "",
            isNewRegistration: true,
            documents: data.documents || []
          }
        });
        break;
      }
      case "COMPLIANCE": {
        createdRecord = await prisma.compliance.create({
          data: {
            userEmail,
            companyName: data.companyName || "",
            details: data.details || "",
            queryText: data.queryText || "",
            documents: data.documents || []
          }
        });
        break;
      }
      case "NEW_FIRM_REGISTRATION": {
        createdRecord = await prisma.firmRegistration.create({
          data: {
            userEmail,
            requiredName: data.requiredName || "",
            contactPerson: data.contactPerson || "",
            address: data.address || "",
            mobileNo: data.mobileNo || "",
            email: data.email || "",
            businessToStart: data.businessToStart || "",
            documents: data.documents || []
          }
        });
        break;
      }
      case "NEW_UDHYAM_REGISTRATION": {
        createdRecord = await prisma.udhyamRegistration.create({
          data: {
            userEmail,
            requiredName: data.requiredName || "",
            contactPerson: data.contactPerson || "",
            address: data.address || "",
            mobileNo: data.mobileNo || "",
            email: data.email || "",
            businessToStart: data.businessToStart || "",
            isUpdate: false,
            documents: data.documents || []
          }
        });
        break;
      }
      case "UDHYAM_UPDATES": {
        createdRecord = await prisma.udhyamRegistration.create({
          data: {
            userEmail,
            registrationNo: data.registrationNo || "",
            contactPerson: data.contactPerson || "",
            email: data.email || "",
            mobileNo: data.phone || "",
            changeDetails: data.changeDetails || "",
            isUpdate: true,
            documents: data.documents || []
          }
        });
        udyamNo = data.registrationNo;
        break;
      }
      case "OTHER_REQUIREMENTS": {
        createdRecord = await prisma.otherRequirement.create({
          data: {
            userEmail,
            requirementType: data.requirementType || "",
            otherRequirementText: data.otherRequirementText || "",
            contactPerson: data.contactPersonName || "",
            email: data.email || "",
            phone: data.phone || "",
            documents: data.documents || []
          }
        });
        break;
      }
      // Queries
      case "GST_QUERY": {
        createdRecord = await prisma.gstQuery.create({
          data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            gstNumber: data.gstNumber,
            queryType: data.queryType,
            queryDetails: data.queryDetails
          }
        });
        gstNo = data.gstNumber;
        break;
      }
      case "COMPANY_QUERY": {
        createdRecord = await prisma.companyQuery.create({
          data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            cin: data.cin,
            queryType: data.queryType,
            queryDetails: data.queryDetails
          }
        });
        cinNo = data.cin;
        break;
      }
      case "FIRM_QUERY": {
        createdRecord = await prisma.firmQuery.create({
          data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            firmName: data.firmName,
            queryDetails: data.queryDetails
          }
        });
        break;
      }
      case "UDHYAM_QUERY": {
        createdRecord = await prisma.udhyamQuery.create({
          data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            udhyamNo: data.udhyamNo,
            queryType: data.queryType,
            queryDetails: data.queryDetails
          }
        });
        udyamNo = data.udhyamNo;
        break;
      }
      default:
        return NextResponse.json({ success: false, message: "Invalid form type" }, { status: 400 });
    }

    // Create Service Request
    const request = await prisma.serviceRequest.create({
      data: {
        userEmail,
        clientName,
        serviceType,
        status: "submitted",
        priority: "medium",
        referenceId: createdRecord.id,
        panNumber: panNo,
        gstNumber: gstNo,
        cinNumber: cinNo,
        udhyamNumber: udyamNo,
        financialYear: fy,
        financialMonth: month,
        ...assignment
      }
    });

    return NextResponse.json({
      success: true,
      message: `${type.replace(/_/g, " ")} submitted successfully!`,
      data: createdRecord,
      request
    });

  } catch (error) {
    console.error("Submit Form Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { id, type, data } = await req.json();

    // Verify request can still be modified
    const serviceRequest = await prisma.serviceRequest.findFirst({
      where: {
        referenceId: id,
        serviceType: type === "NEW_COMPANY_REGISTRATION" || type === "ADD_COMPANY" ? { in: ["NEW_COMPANY_REGISTRATION", "ADD_COMPANY"] } : type
      }
    });

    if (serviceRequest && serviceRequest.status !== "submitted" && serviceRequest.status !== "pending_docs") {
      return NextResponse.json({
        success: false,
        message: "This request has already been processed by the admin/team and cannot be modified."
      }, { status: 403 });
    }

    let updatedRecord = null;
    switch (type) {
      case "APPLY_NEW_GST":
        updatedRecord = await prisma.gSTRegistration.update({
          where: { id },
          data: {
            firmName: data.requiredName,
            businessType: data.businessToStart,
            mainPerson: data.contactPerson,
            address: data.address,
            panNo: data.panNo,
            udyamNo: data.mobileNo,
            documents: data.documents
          }
        });
        break;
      case "ADD_COMPANY":
      case "NEW_COMPANY_REGISTRATION":
        updatedRecord = await prisma.companyRegistration.update({
          where: { id },
          data: {
            companyRegNo: data.companyRegNo,
            companyName: data.companyName || data.requiredName,
            contactPerson: data.contactPerson,
            email: data.email || data.emailId,
            phone: data.phone || data.mobileNo,
            address: data.address,
            businessToStart: data.businessToStart,
            documents: data.documents
          }
        });
        break;
      case "COMPLIANCE":
        updatedRecord = await prisma.compliance.update({
          where: { id },
          data: {
            companyName: data.companyName,
            details: data.details,
            queryText: data.queryText,
            documents: data.documents
          }
        });
        break;
      case "NEW_FIRM_REGISTRATION":
        updatedRecord = await prisma.firmRegistration.update({
          where: { id },
          data: {
            requiredName: data.requiredName,
            contactPerson: data.contactPerson,
            address: data.address,
            mobileNo: data.mobileNo,
            email: data.email,
            businessToStart: data.businessToStart,
            documents: data.documents
          }
        });
        break;
      case "NEW_UDHYAM_REGISTRATION":
      case "UDHYAM_UPDATES":
        updatedRecord = await prisma.udhyamRegistration.update({
          where: { id },
          data: {
            requiredName: data.requiredName,
            registrationNo: data.registrationNo,
            contactPerson: data.contactPerson,
            address: data.address,
            mobileNo: data.mobileNo || data.phone,
            email: data.email,
            businessToStart: data.businessToStart,
            changeDetails: data.changeDetails,
            documents: data.documents
          }
        });
        break;
      case "OTHER_REQUIREMENTS":
        updatedRecord = await prisma.otherRequirement.update({
          where: { id },
          data: {
            requirementType: data.requirementType,
            otherRequirementText: data.otherRequirementText,
            contactPerson: data.contactPersonName,
            email: data.email,
            phone: data.phone,
            documents: data.documents
          }
        });
        break;
      case "GST_QUERY":
        updatedRecord = await prisma.gstQuery.update({
          where: { id },
          data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            gstNumber: data.gstNumber,
            queryType: data.queryType,
            queryDetails: data.queryDetails
          }
        });
        break;
      case "COMPANY_QUERY":
        updatedRecord = await prisma.companyQuery.update({
          where: { id },
          data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            cin: data.cin,
            queryType: data.queryType,
            queryDetails: data.queryDetails
          }
        });
        break;
      case "FIRM_QUERY":
        updatedRecord = await prisma.firmQuery.update({
          where: { id },
          data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            firmName: data.firmName,
            queryDetails: data.queryDetails
          }
        });
        break;
      case "UDHYAM_QUERY":
        updatedRecord = await prisma.udhyamQuery.update({
          where: { id },
          data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            udhyamNo: data.udhyamNo,
            queryType: data.queryType,
            queryDetails: data.queryDetails
          }
        });
        break;
      default:
        return NextResponse.json({ success: false, message: "Invalid form type" }, { status: 400 });
    }

    const requestSnapshot = buildServiceRequestSnapshot(type, data);
    const requestUpdate = Object.fromEntries(
      Object.entries(requestSnapshot).filter(([, value]) => value !== undefined)
    );

    await prisma.serviceRequest.updateMany({
      where: {
        referenceId: id,
        serviceType: type,
      },
      data: requestUpdate,
    });

    return NextResponse.json({
      success: true,
      message: `${type.replace(/_/g, " ")} updated successfully!`,
      data: updatedRecord
    });
  } catch (error) {
    console.error("Update Form Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
