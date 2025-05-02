// This file is intentionally empty as we're not using mock services
export class MockPostService {
  static async createPost() {
    throw new Error("Mock service is not implemented")
  }

  static async uploadMedia() {
    throw new Error("Mock service is not implemented")
  }
}
