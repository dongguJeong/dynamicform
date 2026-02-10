```jsx

  const config: FormConfig = {
    apis: [{
      url: "/api/servers",
      fields: ["serverToMove", "serversToDelete"], // 참고용으로만 사용

      // 복잡한 객체 구조 변환
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

  여러 API에 다른 변환 적용

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
