import api from "@/config/api";

export interface TransactionDTO {
  transactionId: string;
  walletId: string;
  tripId?: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  type: string; // OWNER_PAYOUT, COMPENSATION, POST_TRIP_PAYMENT, DEPOSIT, WITHDRAW, etc.
  status: string; // SUCCEEDED, PENDING, FAILED, CANCELLED
  description: string;
  externalTransactionCode?: string;
  createdAt: string;
  completedAt?: string;
}

export interface PaginatedTransactions {
  data: TransactionDTO[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

const transactionService = {
  /**
   * Get all my transactions (paginated)
   * @param pageNumber - Current page number
   * @param pageSize - Number of items per page
   */
  getAllMyTransactions: async (pageNumber: number = 1, pageSize: number = 10) => {
    try {
      const response = await api.get('/api/Transaction', {
        params: { pageNumber, pageSize }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  },

  /**
   * Get transaction by ID
   * @param transactionId - Transaction ID
   */
  getTransactionById: async (transactionId: string) => {
    try {
      const response = await api.get(`/api/Transaction/${transactionId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching transaction detail:', error);
      throw error;
    }
  },
};

export default transactionService;
