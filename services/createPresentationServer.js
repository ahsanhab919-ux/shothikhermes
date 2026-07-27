export async function createPresentationServer({
  message,
  file_urls,
  token,
  p_id,
  userId,
}) {
  const SLIDE_PREFIX = "/slide";
  const api =
    process.env.NEXT_PUBLIC_API_URL + SLIDE_PREFIX + "/create-presentation";
  /**
   * api return expected: 
   {
  "message": "string",
  "p_id": "string",
  "userId": "string",
  "file_urls": [
    "string"
    ]
  }
   */
  try {
    // Build request body - include p_id and userId for follow-up queries
    // file_urls can be:
    // 1. Array of strings (backward compatibility): ["url1", "url2"]
    // 2. Array of objects with url and name: [{ url: "url1", name: "file.pdf" }, ...]
    const requestBody = {
      message,
      file_urls: file_urls || null,
    };

    // Add p_id and userId only for follow-up queries
    if (p_id) {
      requestBody.p_id = p_id;
    }
    if (userId) {
      requestBody.userId = userId;
    }

    const res = await fetch(api, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await res.json();



    if (!res.ok) {
      return {
        success: false,
        error: data.message || "Failed to create presentation",
      };
    }

    return {
      success: true,
      presentationId:
        data?.presentationId || data?.presentation_id || data?.p_id,
      status: data?.status, // Include status for follow-up queries
      message: data?.message, // Include message
    };
  } catch (err) {
    console.error("Server action failed:", err);
    return { success: false, error: err.message || "Something went wrong" };
  }
}
