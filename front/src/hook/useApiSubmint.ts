import { useCallback, useMemo } from "react";
import axios, { AxiosInstance, AxiosError } from "axios";
import { ApiRequestBody, ApiConfig, FormConfig } from "../types/type";

// axios 인스턴스 생성 (선택사항: 기본 설정 추가 가능)
const createAxiosInstance = (
  baseURL?: string,
  timeout: number = 10000,
): AxiosInstance => {
  return axios.create({
    baseURL,
    timeout,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const useApiSubmit = (baseURL?: string, timeout: number = 10000) => {
  // axios 인스턴스 생성 (useMemo로 캐싱하여 불필요한 재생성 방지)
  const axiosInstance = useMemo(
    () => createAxiosInstance(baseURL, timeout),
    [baseURL, timeout],
  );

  /**
   * 단일 API로 데이터 전송
   */
  const submitSingleApi = useCallback(
    async (
      url: string,
      formData: FormData,
      fieldMapping?: Record<string, string>,
    ) => {
      // fieldMapping이 있으면 필드명을 변환
      const body: ApiRequestBody = {};

      Object.entries(formData).forEach(([key, value]) => {
        const apiKey = fieldMapping?.[key] || key;
        body[apiKey] = value;
      });

      try {
        const response = await axiosInstance.post(url, body);
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const message =
            error.response?.data?.message || error.message || "API 요청 실패";
          throw new Error(message);
        }
        throw error;
      }
    },
    [axiosInstance],
  );

  /**
   * 여러 API로 데이터 전송 (각 API별로 필드를 분류해서 전송)
   */
  const submitMultipleApis = useCallback(
    async (apis: ApiConfig[], formData: FormData) => {
      console.log("🔄 submitMultipleApis 호출:", { apis, formData });

      const results: Record<string, any> = {};
      const errors: Record<string, string> = {};

      // 각 API에 대해 순차적으로 요청
      for (const apiConfig of apis) {
        console.log(
          `📡 API 요청 ${apis.indexOf(apiConfig) + 1}/${apis.length}:`,
          apiConfig.url,
        );

        try {
          // 이 API에 필요한 필드들만 추출
          const apiBody: ApiRequestBody = {};

          apiConfig.fields.forEach((fieldId) => {
            if (fieldId in formData) {
              // fieldMapping이 있으면 필드명을 변환
              const apiKey = apiConfig.fieldMapping?.[fieldId] || fieldId;
              apiBody[apiKey] = formData[fieldId];
            }
          });

          console.log(`📨 ${apiConfig.url} 요청 바디:`, apiBody);

          // HTTP 메서드에 따라 요청
          const method = (apiConfig.method || "POST").toUpperCase();
          let response;

          switch (method) {
            case "PUT":
              response = await axiosInstance.put(apiConfig.url, apiBody);
              break;
            case "PATCH":
              response = await axiosInstance.patch(apiConfig.url, apiBody);
              break;
            case "POST":
            default:
              response = await axiosInstance.post(apiConfig.url, apiBody);
              break;
          }

          console.log(`✅ ${apiConfig.url} 성공:`, response.data);
          results[apiConfig.url] = response.data;
        } catch (error) {
          let errorMessage = "알 수 없는 오류";

          if (axios.isAxiosError(error)) {
            if (error.response?.status === 404) {
              errorMessage = "찾을 수 없음";
            } else if (error.response?.status === 400) {
              errorMessage = error.response?.data?.message || "잘못된 요청";
            } else if (error.response?.status === 401) {
              errorMessage = "인증이 필요합니다";
            } else if (error.response?.status === 403) {
              errorMessage = "접근이 거부되었습니다";
            } else if (error.response?.status === 500) {
              errorMessage = "서버 오류가 발생했습니다";
            } else if (error.response?.status === 503) {
              errorMessage = "서비스를 사용할 수 없습니다";
            } else if (error.message === "Network Error") {
              errorMessage = "네트워크 연결을 확인하세요";
            } else if (error.code === "ECONNABORTED") {
              errorMessage = "요청 시간이 초과되었습니다";
            } else {
              errorMessage =
                error.response?.data?.message ||
                error.message ||
                "알 수 없는 오류";
            }
          } else if (error instanceof Error) {
            errorMessage = error.message;
          }

          errors[apiConfig.url] = errorMessage;
        }
      }

      // 하나라도 에러가 있으면 실패 처리
      if (Object.keys(errors).length > 0) {
        throw new Error(
          `API 요청 실패:\n${Object.entries(errors)
            .map(([url, err]) => `${url}: ${err}`)
            .join("\n")}`,
        );
      }

      return results;
    },
    [axiosInstance],
  );

  /**
   * FormConfig에 따라 적절한 방식으로 데이터 전송
   */
  const submitForm = useCallback(
    async (config: FormConfig, formData: FormData) => {
      // API가 여러 개인 경우
      if (config.apis && config.apis.length > 0) {
        return await submitMultipleApis(config.apis, formData);
      }
      // 단일 API인 경우 (기존 방식)
      else if (config.api) {
        return await submitSingleApi(config.api, formData);
      }
      // API가 없으면 에러
      else {
        throw new Error("API 설정이 없습니다.");
      }
    },
    [submitSingleApi, submitMultipleApis],
  );

  return { submitForm, submitSingleApi, submitMultipleApis, axiosInstance };
};

export default useApiSubmit;
