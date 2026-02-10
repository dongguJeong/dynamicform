# DynamicForm 개발 가이드

## 1. dataTransformer 기능 (✅ 완료)

### 구현 내용
- `ApiConfig`에 `dataTransformer` 함수 추가
- 복잡한 중첩 객체를 API 요청 형태로 자유롭게 변환 가능

### 위치
- **타입 정의**: `front/src/types/type.ts:118-125`
- **구현 로직**: `front/src/hook/useApiSubmint.ts:76-91`

### 사용 방법

#### 기본 사용 (필드명만 변경)
```typescript
const config: FormConfig = {
  apis: [{
    url: "/api/simple",
    fields: ["title", "content"],
    fieldMapping: {
      "title": "requestTitle"
    }
  }]
};
```

#### 복잡한 중첩 객체 변환
```typescript
const config: FormConfig = {
  apis: [{
    url: "/api/servers",
    fields: ["serverToMove", "serversToDelete"],

    dataTransformer: (formData) => {
      return {
        moveRequest: {
          targetId: formData.serverToMove.id,
          serverNames: formData.serverToMove.servers.map(s => s.name),
          serverIds: formData.serverToMove.servers.map(s => s.id)
        },
        deleteRequest: {
          ids: formData.serversToDelete.servers.map(s => s.id),
          reason: formData.serversToDelete.reason
        },
        timestamp: new Date().toISOString()
      };
    }
  }]
};
```

#### 여러 API에 다른 변환 적용
```typescript
const config: FormConfig = {
  apis: [
    {
      url: "/api/servers/move",
      fields: ["serverToMove"],
      dataTransformer: (formData) => ({
        serverId: formData.serverToMove.id,
        targetGroup: formData.serverToMove.targetGroup
      })
    },
    {
      url: "/api/servers/delete",
      fields: ["serversToDelete"],
      dataTransformer: (formData) => ({
        serverIds: formData.serversToDelete.servers.map(s => s.id)
      })
    }
  ]
};
```

---

## 2. FormFieldComponent 재사용 가이드

### 개요
- DynamicForm에서 FormFieldComponent만 분리하여 다른 프로젝트에서 사용
- 확인 버튼 없이 실시간으로 부모 컴포넌트에 값 전달
- 부모 컴포넌트에서 상태 및 검증 관리

### 핵심 구조
```
App (최상위)
  └─ ParentComponent (검증 로직 관리)
      ├─ formData (상태)
      ├─ errors (상태)
      ├─ touched (상태)
      ├─ useFormValidation (훅)
      ├─ handleFieldChange (검증 + 상태 업데이트)
      ├─ handleFieldBlur (터치 표시)
      └─ FormFields (자식 - 순수 UI)
          └─ FormFieldComponent (필드 렌더링)
```

---

## 3. 부모 컴포넌트에서 Validation 관리

### 재사용 가능한 폼 컴포넌트 (자식)

```typescript
// components/FormFields.tsx
import React from 'react';
import { FormFieldComponent } from './FormFieldComponent';
import { FormField, FormData, ValidationError } from '../types/type';

interface FormFieldsProps {
  fields: FormField[];
  formData: FormData;
  errors: ValidationError;
  onChange: (fieldId: string, value: any) => void;
  onBlur?: (fieldId: string) => void;
}

export const FormFields: React.FC<FormFieldsProps> = ({
  fields,
  formData,
  errors,
  onChange,
  onBlur
}) => {
  return (
    <div>
      {fields.map(field => (
        <div
          key={field.id}
          onBlur={() => onBlur?.(field.id)}
        >
          <FormFieldComponent
            field={field}
            value={formData[field.id]}
            errors={errors}
            onChange={onChange}
          />
        </div>
      ))}
    </div>
  );
};
```

### 부모 컴포넌트에서 검증 로직 관리

```typescript
// ParentComponent.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { FormFields } from './components/FormFields';
import { useFormValidation } from './hook/useFormValidation';
import { FormField, FormData, ValidationError } from './types/type';

interface ParentComponentProps {
  onDataSubmit?: (data: FormData) => void;
  onDataChange?: (data: FormData, isValid: boolean) => void; // 실시간 콜백
}

export const ParentComponent: React.FC<ParentComponentProps> = ({
  onDataSubmit,
  onDataChange
}) => {
  // 상태 관리
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    serverToMove: {
      id: 0,
      servers: []
    }
  });

  const [errors, setErrors] = useState<ValidationError>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // Validation 훅
  const { validateField, validateForm } = useFormValidation();

  // 필드 정의
  const fields: FormField[] = [
    {
      id: 'username',
      type: 'text',
      label: '사용자 이름',
      required: true,
      options: {
        minLength: 2,
        maxLength: 20
      }
    },
    {
      id: 'email',
      type: 'email',
      label: '이메일',
      required: true
    }
  ];

  // 필드 값 변경 핸들러
  const handleFieldChange = useCallback((fieldId: string, value: any) => {
    // 1. formData 업데이트
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));

    // 2. 터치된 필드만 실시간 검증
    if (touched.has(fieldId)) {
      const field = fields.find(f => f.id === fieldId);
      if (field) {
        const fieldErrors = validateField(field, value);

        setErrors(prev => {
          if (fieldErrors.length === 0) {
            const newErrors = { ...prev };
            delete newErrors[fieldId];
            return newErrors;
          }
          return {
            ...prev,
            [fieldId]: fieldErrors
          };
        });
      }
    }
  }, [touched, fields, validateField]);

  // 필드 blur 핸들러 (터치 표시)
  const handleFieldBlur = useCallback((fieldId: string) => {
    setTouched(prev => new Set(prev).add(fieldId));

    // blur 시 검증
    const field = fields.find(f => f.id === fieldId);
    if (field) {
      const fieldErrors = validateField(field, formData[fieldId]);
      if (fieldErrors.length > 0) {
        setErrors(prev => ({
          ...prev,
          [fieldId]: fieldErrors
        }));
      }
    }
  }, [fields, formData, validateField]);

  // 전체 검증 (확인 버튼 클릭 시)
  const handleValidateAll = useCallback(() => {
    const validationErrors = validateForm(formData, fields);
    setErrors(validationErrors);

    const isValid = Object.keys(validationErrors).length === 0;

    if (isValid) {
      console.log('✅ 검증 통과:', formData);

      // 상위 컴포넌트로 데이터 전달
      if (onDataSubmit) {
        onDataSubmit(formData);
      }
    } else {
      console.log('❌ 검증 실패:', validationErrors);

      // 모든 필드를 터치 상태로 변경 (에러 표시)
      setTouched(new Set(fields.map(f => f.id)));
    }

    return isValid;
  }, [formData, fields, validateForm, onDataSubmit]);

  // formData 변경 시 실시간으로 상위에 전달
  useEffect(() => {
    if (onDataChange) {
      const isValid = Object.keys(errors).length === 0;
      onDataChange(formData, isValid);
    }
  }, [formData, errors, onDataChange]);

  // 검증 상태 확인
  const isFormValid = Object.keys(errors).length === 0 &&
                      touched.size === fields.length;

  return (
    <div className="parent-component">
      <h2>폼 입력</h2>

      {/* 자식 컴포넌트에 props 전달 */}
      <FormFields
        fields={fields}
        formData={formData}
        errors={errors}
        onChange={handleFieldChange}
        onBlur={handleFieldBlur}
      />

      {/* 검증 상태 표시 */}
      <div className="mt-2">
        <span className={isFormValid ? 'text-success' : 'text-muted'}>
          검증 상태: {isFormValid ? '✓ 통과' : '× 미완료'}
        </span>
      </div>

      {/* 확인 버튼 */}
      <div className="mt-3">
        <button
          className="btn btn-primary"
          onClick={handleValidateAll}
        >
          확인
        </button>
      </div>
    </div>
  );
};
```

---

## 4. 커스텀 검증 추가 방법

```typescript
// ParentComponent.tsx에 추가
const customValidate = useCallback((fieldId: string, value: any, allFormData: FormData): string[] => {
  const customErrors: string[] = [];

  // 복잡한 객체 검증
  if (fieldId === 'serverToMove') {
    if (value.servers && value.servers.length === 0) {
      customErrors.push('최소 1개의 서버를 선택해주세요.');
    }
    if (value.id <= 0) {
      customErrors.push('유효한 서버 ID를 입력해주세요.');
    }
  }

  // 다른 필드와 비교 검증
  if (fieldId === 'passwordConfirm') {
    if (value !== allFormData.password) {
      customErrors.push('비밀번호가 일치하지 않습니다.');
    }
  }

  // 전화번호 형식
  if (fieldId === 'phone' && value) {
    const phoneRegex = /^01[0-9]-?[0-9]{4}-?[0-9]{4}$/;
    if (!phoneRegex.test(value)) {
      customErrors.push('올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)');
    }
  }

  return customErrors;
}, []);

// handleFieldChange 수정
const handleFieldChange = useCallback((fieldId: string, value: any) => {
  const newFormData = {
    ...formData,
    [fieldId]: value
  };

  setFormData(newFormData);

  if (touched.has(fieldId)) {
    const field = fields.find(f => f.id === fieldId);
    if (field) {
      // 기본 검증
      const baseErrors = validateField(field, value);

      // 커스텀 검증
      const customErrors = customValidate(fieldId, value, newFormData);

      // 합치기
      const allErrors = [...baseErrors, ...customErrors];

      setErrors(prev => {
        if (allErrors.length === 0) {
          const newErrors = { ...prev };
          delete newErrors[fieldId];
          return newErrors;
        }
        return {
          ...prev,
          [fieldId]: allErrors
        };
      });
    }
  }
}, [formData, touched, fields, validateField, customValidate]);
```

---

## 5. 상위 컴포넌트에서 사용 예시

```typescript
// App.tsx
import React from 'react';
import { ParentComponent } from './ParentComponent';
import { FormData } from './types/type';

export const App: React.FC = () => {
  const handleDataSubmit = (data: FormData) => {
    console.log('📦 최종 제출 데이터:', data);
    // API 호출 또는 다른 처리
  };

  const handleDataChange = (data: FormData, isValid: boolean) => {
    console.log('📝 실시간 데이터:', data);
    console.log('✓ 검증 상태:', isValid);
  };

  return (
    <div className="app">
      <ParentComponent
        onDataSubmit={handleDataSubmit}
        onDataChange={handleDataChange}
      />
    </div>
  );
};
```

---

## 6. DynamicForm unicode 옵션 (✅ 완료)

### 개요
- DynamicForm에 `unicode` 옵션 추가하여 **독립형**과 **제어형** 모드로 사용 가능
- `unicode: true`일 때 제출 버튼 숨기고 부모 컴포넌트에서 상태 관리

### 구현 내용

#### Props 추가
```typescript
interface DynamicFormProps {
  // ... 기존 props
  unicode?: boolean;                          // 제어 컴포넌트 모드 활성화
  value?: FormDataType;                       // 부모에서 관리하는 formData
  onChange?: (data: FormDataType) => void;    // 부모로 formData 전달
}
```

#### 위치
- **타입 정의 및 구현**: `front/src/component/DynamicForm.tsx`

### 사용 방법

#### unicode: false (기본 모드 - 독립형)
```typescript
<DynamicForm
  config={config}
  onSuccess={(data) => {
    console.log('제출 완료:', data);
    // API 호출 또는 처리
  }}
/>
```

**특징:**
- ✅ 제출 버튼 표시
- ✅ 내부에서 formData 상태 관리
- ✅ handleSubmit으로 데이터 제출
- ✅ dataTransformer 사용하여 API 전송

#### unicode: true (제어 컴포넌트 모드)
```typescript
const ParentComponent = () => {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    serverToMove: {
      id: 0,
      servers: []
    }
  });

  const config: FormConfig = {
    title: "사용자 정보",
    content: [
      {
        id: 'username',
        type: 'text',
        label: '사용자 이름',
        required: true
      },
      {
        id: 'email',
        type: 'email',
        label: '이메일',
        required: true
      },
      {
        id: 'serverToMove',
        type: 'servergroupchange',
        label: '서버 이동',
        required: true
      }
    ]
  };

  return (
    <div>
      {/* DynamicForm을 제어 컴포넌트로 사용 */}
      <DynamicForm
        config={config}
        unicode={true}
        value={formData}
        onChange={(data) => {
          console.log('실시간 데이터:', data);
          setFormData(data);
        }}
      />

      {/* 부모에서 확인 버튼 관리 */}
      <button onClick={() => {
        console.log('최종 제출:', formData);
        // 부모에서 직접 API 호출 또는 처리
        submitToApi(formData);
      }}>
        확인
      </button>

      {/* 현재 데이터 표시 */}
      <div>
        <h5>현재 formData:</h5>
        <pre>{JSON.stringify(formData, null, 2)}</pre>
      </div>
    </div>
  );
};
```

**특징:**
- ✅ 제출 버튼 숨김
- ✅ 부모에서 formData 관리 (제어 컴포넌트)
- ✅ 실시간으로 onChange로 데이터 전달
- ✅ 부모에서 확인 버튼 및 제출 로직 관리
- ✅ FormFieldComponent만 사용하는 것과 동일한 효과

### unicode: true + Validation 처리

```typescript
const ParentComponent = () => {
  const [formData, setFormData] = useState<FormData>({});
  const [errors, setErrors] = useState<ValidationError>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const { validateForm, validateField } = useFormValidation();

  const config: FormConfig = {
    // ... config 정의
  };

  // 필드 변경 핸들러 (실시간 검증 포함)
  const handleChange = (data: FormData) => {
    setFormData(data);

    // 터치된 필드만 실시간 검증
    Object.keys(data).forEach(fieldId => {
      if (touched.has(fieldId)) {
        const field = config.content.find(f => f.id === fieldId);
        if (field) {
          const fieldErrors = validateField(field, data[fieldId]);

          setErrors(prev => {
            if (fieldErrors.length === 0) {
              const newErrors = { ...prev };
              delete newErrors[fieldId];
              return newErrors;
            }
            return {
              ...prev,
              [fieldId]: fieldErrors
            };
          });
        }
      }
    });
  };

  // 전체 검증 및 제출
  const handleValidateAndSubmit = () => {
    const validationErrors = validateForm(formData, config.content);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      console.log('✅ 검증 통과, 제출:', formData);
      // API 호출
      submitToApi(formData);
    } else {
      console.log('❌ 검증 실패:', validationErrors);
      // 모든 필드를 터치 상태로 변경 (에러 표시)
      setTouched(new Set(config.content.map(f => f.id)));
    }
  };

  return (
    <div>
      <DynamicForm
        config={config}
        unicode={true}
        value={formData}
        onChange={handleChange}
      />

      {/* 검증 상태 표시 */}
      <div>
        {Object.keys(errors).length > 0 && (
          <div className="text-danger">
            검증 오류가 있습니다.
          </div>
        )}
      </div>

      <button onClick={handleValidateAndSubmit}>
        확인
      </button>
    </div>
  );
};
```

### unicode: true + dataTransformer 조합

```typescript
const ParentComponent = () => {
  const [formData, setFormData] = useState<FormData>({
    serverToMove: {
      id: 0,
      servers: []
    }
  });

  const config: FormConfig = {
    title: "서버 관리",
    content: [
      {
        id: 'serverToMove',
        type: 'servergroupchange',
        label: '서버 이동',
        required: true
      }
    ],
    // unicode: true여도 dataTransformer 정의 가능
    apis: [{
      url: "/api/servers/move",
      fields: ["serverToMove"],
      dataTransformer: (formData) => ({
        serverId: formData.serverToMove.id,
        serverNames: formData.serverToMove.servers.map(s => s.name)
      })
    }]
  };

  const handleSubmit = async () => {
    // 부모에서 직접 API 호출 시 dataTransformer 활용
    const transformedData = config.apis![0].dataTransformer!(formData);

    console.log('원본 데이터:', formData);
    console.log('변환된 데이터:', transformedData);

    // API 호출
    await fetch(config.apis![0].url, {
      method: 'POST',
      body: JSON.stringify(transformedData)
    });
  };

  return (
    <div>
      <DynamicForm
        config={config}
        unicode={true}
        value={formData}
        onChange={setFormData}
      />

      <button onClick={handleSubmit}>
        확인
      </button>
    </div>
  );
};
```

### 비교표

| 기능 | unicode: false (독립형) | unicode: true (제어형) |
|------|------------------------|----------------------|
| 제출 버튼 | ✅ 표시 | ❌ 숨김 |
| formData 관리 | DynamicForm 내부 | 부모 컴포넌트 |
| 데이터 전달 | onSuccess 콜백 | onChange 콜백 (실시간) |
| 제출 로직 | handleSubmit (내부) | 부모에서 직접 처리 |
| dataTransformer | 자동 적용 | 수동 적용 가능 |
| 사용 용도 | 독립적인 완전한 폼 | 부모가 제어하는 폼 |

---

## 주요 기능 요약

### ✅ 완료된 기능
1. **dataTransformer**: 복잡한 중첩 객체를 API 요청 형태로 변환
2. **부모 컴포넌트 검증**: useFormValidation 훅을 사용한 실시간 검증
3. **실시간 데이터 전달**: onChange, useEffect를 통한 즉시 전달
4. **커스텀 검증**: 프로젝트별 필요에 따라 검증 로직 추가 가능
5. **unicode 옵션**: DynamicForm을 독립형/제어형으로 선택 사용

### 📌 핵심 패턴
- **제어 컴포넌트 패턴**: 부모에서 value와 onChange 관리 (unicode: true)
- **터치 기반 검증**: 사용자가 입력한 필드만 검증 표시
- **실시간 vs 확인 시 검증**: 두 가지 방식 모두 지원
- **독립형 vs 제어형**: unicode 옵션으로 사용 방식 선택

### 🔧 관련 파일
- `front/src/types/type.ts` - 타입 정의
- `front/src/hook/useApiSubmint.ts` - API 제출 로직
- `front/src/hook/useFormValidation.ts` - 검증 로직
- `front/src/component/FormFieldComponent.tsx` - 필드 컴포넌트
- `front/src/component/DynamicForm.tsx` - DynamicForm 컴포넌트 (unicode 옵션 추가)
