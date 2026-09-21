import { supabase } from "@/lib/supabaseClient";

// Fetch all branches and queue status
export const fetchBranchQueueStatus = async () => {
  try {
    console.log("Fetching branches and queue status from Supabase...");
    const { data, error } = await supabase
      .from("branches")
      .select("id, name, location, capacity, queues(queue_number, status)");

    if (error) {
      throw new Error(`Error fetching branch queue data: ${error.message}`);
    }

    console.log("Fetched branch data:", data);

    return data.map((branch: { id: string; name: string; location: string; capacity: number; queues: { queue_number: number; status: string }[] }) => {
      const activeQueues = branch.queues.filter((q: { queue_number: number; status: string }) => q.status === "waiting");
      return {
        id: branch.id,
        name: branch.name,
        currentNumber: Math.max(...branch.queues.map((q: { queue_number: number; status: string }) => q.queue_number), 0),
        queuing: activeQueues.length,
        crowdStatus: activeQueues.length >= branch.capacity ? "Crowded 🚨" : "Not Crowded ✅",
        isFull: activeQueues.length >= branch.capacity
      };
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error fetching branch queue status:", error.message);
      throw new Error(error.message);
    }
    console.error("Unknown error:", error);
    throw new Error("Unknown error occurred");
  }
};

// Check if the user has an active queue
export const checkUserQueue = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("queues")
      .select("queue_number")
      .eq("user_id", userId) // Assuming you have a user_id field in the queue table
      .single(); // Get a single row

    if (error) {
      throw new Error(`Error checking user queue: ${error.message}`);
    }

    console.log("User queue:", data);
    return data ? data.queue_number : null; // Return the queue number or null if no queue found
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error checking user queue:", error.message);
      throw new Error(error.message);
    }
    console.error("Unknown error:", error);
    throw new Error("Unknown error occurred");
  }
};

// Book a queue number for a branch
export const bookQueueNumber = async (branchId: string, userId: string) => {
  try {
    console.log(`Booking queue for branch: ${branchId} and user: ${userId}`);

    // Check if the user already has a queue number before booking a new one
    const existingQueue = await checkUserQueue(userId);
    if (existingQueue) {
      throw new Error('You already have a queue number. Please cancel it first.');
    }

    const { data, error } = await supabase
      .from("queues")
      .insert([{ branch_id: branchId, user_id: userId }])
      .select();

    if (error) {
      throw new Error(`Error booking queue: ${error.message}`);
    }

    console.log("Queue number booked:", data[0].queue_number);
    return data[0].queue_number;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error booking queue:", error.message);
      throw new Error(error.message);
    }
    console.error("Unknown error:", error);
    throw new Error("Unknown error occurred");
  }
};

// Cancel a user's queue
export const cancelQueue = async (userId: string) => {
  try {
    console.log(`Canceling queue for user: ${userId}`);

    const { data, error } = await supabase
      .from("queues")
      .delete()
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Error canceling queue: ${error.message}`);
    }

    console.log("Queue canceled:", data);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error canceling queue:", error.message);
      throw new Error(error.message);
    }
    console.error("Unknown error:", error);
    throw new Error("Unknown error occurred");
  }
};
