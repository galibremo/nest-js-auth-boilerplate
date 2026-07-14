import type { ApiPagination } from '../../core/validators/api-response.schema';

export interface CreateApiResponseOptions<TData> {
	statusCode: number;
	message: string;
	path: string;
	data?: TData;
	pagination?: ApiPagination;
}

export function createApiResponse<TData>({
	statusCode,
	message,
	path,
	data,
	pagination,
}: CreateApiResponseOptions<TData>) {
	return {
		statusCode,
		message,
		data,
		pagination,
		timestamp: new Date().toISOString(),
		path,
	};
}
