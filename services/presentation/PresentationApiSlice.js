export default class PresentationAPIService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async checkStatus(pId) {
    const response = await fetch(`${this.baseUrl}/presentation-status/${pId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }
    return response.json();
  }

  async getHistory(pId) {
    const response = await fetch(`${this.baseUrl}/logs?p_id=${pId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });
    if (!response.ok) {
      throw new Error(`History fetch failed: ${response.status}`);
    }
    return response.json();
  }
}
