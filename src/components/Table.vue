<template>
  <a-upload-dragger style="display: flex;flex-direction: column; width: 400px;align-items: start;margin-top: 10px"
                    v-model:file-list="fileList"
                    name="file"
                    :headers="headers"
                    @change="handleChange"
                    :before-upload="beforeUpload"
                    :multiple="false"
                    accept=".har"
                    :showUploadList="false"
                    @remove="removeHarFile"
  >
    <!--    <a-button>-->
    <!--      <upload-outlined></upload-outlined>-->
    <!--      上传har文件-->
    <!--    </a-button>-->
    <div
        class="uploadDiv">
      <p class="ant-upload-drag-icon">
        <inbox-outlined></inbox-outlined>
      </p>
      <p class="ant-upload-text">Click or drag har file to this area</p>
    </div>
  </a-upload-dragger>
  <a-form class="condition" :model="formState">
    <div style="display: flex;align-items: center;gap: 1rem">
      <a-form-item label="file" style="margin-top: 10px">
        <a-select style="width: 400px;max-width: 600px" :options="harFileOptions" v-model:value="formState.file"
                  placeholder=""></a-select>

      </a-form-item>
      <div v-if="creator">
        <p style="color: gray">{{ creator }}</p>
      </div>
    </div>


    <a-form-item label="status code">
      <a-radio-group class="radio" v-model:value="formState.status" option-type="button"
                     :options="statusOptions"/>

    </a-form-item>
    <!--    <a-form-item label="状态码说明">-->
    <!--      <a-radio-group class="radio" option-type="button" :options="statusTextOptions"-->
    <!--                     v-model:value="formState.statusText"-->
    <!--                     placeholder=""></a-radio-group>-->
    <!--    </a-form-item>-->
    <a-form-item label="content-type">
      <a-radio-group class='radio' :options="contentTypeOptions" v-model:value="formState.contentType"
                     placeholder="" option-type="button"></a-radio-group>
    </a-form-item>
    <a-form-item label="url" style="max-width: 700px">
      <a-input v-model:value="formState.url" placeholder="search url"/>
    </a-form-item>
  </a-form>

  <a-space direction="vertical" style="display: flex; margin: 10px">
    <a-space warp>
      <a-tooltip title="add new">
        <a-button :disabled="Object.keys(harFiles.valueOf()).length===0" @click="addEntries">
          <FileAddOutlined/>
        </a-button>
      </a-tooltip>
      <a-tooltip title="copy from pasteboard">
        <a-button :disabled="Object.keys(harFiles.valueOf()).length===0" @click="readClipboardText">
          <SnippetsOutlined/>
        </a-button>
      </a-tooltip>
      <a-tooltip title="download har files">
        <a-button :disabled="Object.keys(harFiles.valueOf()).length===0" @click="downloadHAR">
          <DownloadOutlined/>
        </a-button>
      </a-tooltip>
    </a-space>
  </a-space>

  <a-table :columns="columns" :data-source="filterTableData" :scroll="{ x: 1200 }"
           style="overflow: scroll;width: 100%;margin-top: 10px"
           :currentPage="currentPage">
    <template #bodyCell="{ column,record,idx }">
      <template v-if="column.key === 'operation'">
        <a>Publish</a>
      </template>
      <template v-else-if="column.dataIndex === 'operation'">
        <a-button @click="onDelete(record.key)">
          <DeleteOutlined/>
        </a-button>
        <a-button @click="editShowModal(record)">
          <EditOutlined/>
        </a-button>
        <a-button @click="quickCopy(record)">
          <CopyOutlined/>
        </a-button>
      </template>
    </template>

    <template #expandedRowRender="{ record }">
      <a-collapse v-model:activeKey="activeKey">
        <a-collapse-panel :key="0" header="request">
          <JsonEditorVue
              v-model="record.request"
              mode="text"
              :mainMenuBar="false"
              :statusBar="true"
              :stringified="false"
          />
        </a-collapse-panel>

        <a-collapse-panel :key="1" header="response">
          <JsonEditorVue
              v-model="record.response"
              mode="text"
              :mainMenuBar="false"
              :statusBar="true"
              :stringified="false"
          />
        </a-collapse-panel>

      </a-collapse>
    </template>
  </a-table>
  <a-modal v-model:open="editOpen" width="1000px" title="Basic Modal" @ok="handleEditOk">
    <JsonEditorVue
        v-model="editRecord"
        mode="text"
        :mainMenuBar="false"
        :statusBar="true"
        :stringified="false"
    />
  </a-modal>

  <a-modal v-model:open="addOpen" width="1000px" style="min-height: 500px" title="add new record" @ok="handleAddOk">
    <JsonEditorVue
        v-model="addRecord"
        mode="text"
        :mainMenuBar="false"
        :statusBar="true"
        :stringified="false"
    />
  </a-modal>
</template>
<script lang="ts" setup>
import {
  InboxOutlined,
  DeleteOutlined,
  EditOutlined,
  CopyOutlined,
  DownloadOutlined,
  FileAddOutlined,
  SnippetsOutlined,
  UploadOutlined
} from '@ant-design/icons-vue';
import type {UnwrapRef} from 'vue';
import {computed, reactive, ref, watch} from 'vue';
import type {UploadChangeParam} from 'ant-design-vue';
import {message, UploadProps} from 'ant-design-vue';
import JsonEditorVue from 'json-editor-vue'
import {destr} from "destr";
import {copyText} from 'vue3-clipboard'

const columns = [
  {
    title: 'id',
    key: 'idx',
    dataIndex: 'key',
    width: 50
  },
  {title: 'status', dataIndex: ['response', 'status'], key: 'status', width: 80},
  {title: 'method', dataIndex: ['request', 'method'], width: 100},
  {
    title: 'url', dataIndex: ['request', 'url'], key: 'url', width: 500, ellipsis: true,
    render: url => url.split('?')[0]
  },
  // {title: 'statusText', dataIndex: ['response', 'statusText'], width: 150, key: 'statusText'},
  {title: 'contentLength', dataIndex: ['response', 'contentLength'], key: 'contentLength', width: 150},
  // {
  //   title: 'response', dataIndex: ['response',], width: 300, ellipsis: true,
  //   render: (response) => {
  //     return JSON.stringify(response)
  //   },
  // },
  {
    title: 'operation',
    dataIndex: 'operation',
    width: 150
  },
];

let currentPage = ref(0);
let harFiles = ref({})
const onDelete = (key: number) => {
  console.log('delete: ', key)
  harFiles.value[formState.file].log.entries = harFiles.value[formState.file].log.entries.filter(item => item.key !== key);
};

const filterTableData = computed(() => {
      if (!formState.file || Object.keys(harFiles.value).length === 0) return []
      return harFiles.value[formState.file].log.entries.filter(
          (data) => {
            if (!formState.url && formState.status === null && !formState.statusText) {
              return true
            }

            if (formState.url && !data.request.url.toLowerCase().includes(formState.url.toLowerCase())) {
              return false
            }
            if (formState.status && data.response.status !== Number(formState.status)) {
              return false
            }

            if (formState.statusText && data.response.statusText !== formState.statusText) {
              return false
            }

            console.log('contentType: ', formState.contentType)
            if (formState.contentType) {
              const result = data.response.headers.filter(item => item.name.toLowerCase() === 'content-type')
              if (result.length === 0 || !result[0].value.includes(formState.contentType)) {
                return false
              }
            }

            return true
          }
      )
    }
)

const creator = computed(() => {
  if (!formState.file) {
    return ''
  }

  const har = harFiles.value[formState.file].log
  const creator = har.creator
  const date = har.pages.length > 0 ? har.pages[0].startedDateTime : "";
  return `${creator.name} ${creator.version} ${date}`
})

const handleChange = (info: UploadChangeParam) => {
  if (info.file.status !== 'uploading') {
    console.log(info.file);
  }

  const reader = new FileReader();

  // 例如：读取文本内容
  reader.readAsText(info.file)
  // 若需要读取为 Base64 数据，可以使用 readAsDataURL(file)
  // reader.readAsDataURL(file);
  // 若需要读取为二进制数据，可以使用 readAsArrayBuffer(file)
  // reader.readAsArrayBuffer(file);

  // 读取成功后的回调
  reader.onload = (e) => {
    let file = e.target
    console.log(file)
    const fileContent = e.target.result;
    // console.log('文件内容：', fileContent);
    let result = destr(String(fileContent))
    // 这里可以对 fileContent 进行进一步处理
    result.log.entries.map((item, index) => {
      item.key = index
      item.response.key = index
      let contentLength = item.response.content.size
      let headers = item.response.headers.filter(item => item.name === 'Content-Length')
      if (headers.length > 0) {
        contentLength = headers[0].value
      }

      item.response.contentLength = contentLength
    })


    harFiles.value[info.file.name] = result
    formState.file = info.file.name
    message.success(`${info.file.name} file parse success`);
  };

  // 读取出错时的回调
  reader.onerror = (err) => {
    message.error('file read failed');
    console.error(err);
  };

  if (info.file.status === 'done') {
    message.success(`${info.file.name} file uploaded successfully`);
  } else if (info.file.status === 'error') {
    message.error(`${info.file.name} file upload failed.`);
  }
};
const harFileOptions = computed(() => fileList.value.map(file => {
  return {label: file.name, value: file.name}
}))
const statusOptions = computed(() => {
  if (!formState.file || Object.keys(harFiles.value).length === 0) return []
  let result = [...new Set(harFiles.value[formState.file].log.entries.map(item => item.response.status))]
  result = result.map(status => {
    return {label: String(status), value: status}
  })
  result.unshift({label: "all", value: ''})
  return result
})
const statusTextOptions = computed(() => {
  if (!formState.file || Object.keys(harFiles.value).length === 0) return []
  let result = [...new Set(harFiles.value[formState.file].log.entries.filter(item => item.response.statusText).map(item => item.response.statusText))]
  result = result.map(status => {
    return {label: String(status), value: status}
  })
  result.unshift({label: "all", value: ''})
  return result
})

const contentTypeOptions = computed(() => {
  const contentTypes = ['html', 'css', 'image', 'javascript', 'json', 'font', 'text', 'stream']
  // const contentTypes = {
  //   'html': 'html',
  //   'css': 'css',
  //   'image': 'image',
  //   'javascript': 'javascript',
  //   'x-javascript': 'javascript',
  //   'json': 'json'
  // }
  if (!formState.file || Object.keys(harFiles.value).length === 0) return []
  let result = [...new Set(harFiles.value[formState.file].log.entries.map(item => {
    let headers = item.response.headers.filter(item => item.name.toLowerCase() === 'content-type')
    if (headers.length > 0) {
      const contentType = headers[0].value
      for (let key of contentTypes) {
        if (contentType.includes(key)) {
          console.log(`contentType: ${contentType} exist`)
          return key
        }
      }
      console.log(`contentType: ${contentType} not exist`)

      return contentType
    }

    return null
  }))].filter(item => item !== null).filter(item => item !== '').map(status => {
    return {label: String(status), value: status}
  })
  result.unshift({label: "all", value: ''})
  return result
})
const fileList = ref([]);
const headers = {
  authorization: 'authorization-text',
};

const beforeUpload: UploadProps['beforeUpload'] = file => {
  if (fileList.value.filter(item => item.name === file.name).length > 0) {
    fileList.value = fileList.value.filter(item => item.name !== file.name);
  }
  return false;
};

interface FormState {
  file: string;
  url: string;
  status: number;
  statusText: string;
  contentType: string;
}

const formState: UnwrapRef<FormState> = reactive({
  file: '',
  url: '',
  status: null,
  statusText: null,
  contentType: ''
});

const removeHarFile = (file) => {
  console.log('delete file', file.name)
  delete harFiles.value[file.name]
}

const downloadHAR = () => {
  const jsonString = JSON.stringify(harFiles.value[formState.file], null, 2);
  // 创建 Blob 对象，设置 MIME 类型为 application/json
  const blob = new Blob([jsonString], {type: 'application/json'});
  // 生成一个 URL 对象
  const url = URL.createObjectURL(blob);
  // 创建一个隐藏的 a 标签，设置下载文件名
  const link = document.createElement('a');
  link.href = url;
  link.download = `${formState.file}_${new Date().valueOf()}.har`; // 文件名，可自行修改
  document.body.appendChild(link);
  // 模拟点击
  link.click();
  // 移除 a 标签并释放 URL 对象
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const activeKey = ref(['1']);

watch(activeKey, val => {
  console.log(val);
});

const editOpen = ref<boolean>(false);
const addOpen = ref<boolean>(false);

const editShowModal = (record) => {
  editOpen.value = true;
  editRecord.value = record
  editKey.value = record.key
};


const addEntries = () => {
  addOpen.value = true;
  addRecord.value = {}
};

const editRecord = ref({})
const addRecord = ref({})

const editKey = ref(0)
// const edit
const handleEditOk = (e: MouseEvent) => {

  console.log(editRecord.value);
  editRecord.value.key = editKey.value
  editRecord.value.response.key = editKey.value
  harFiles.value[formState.file].log.entries[editKey.value] = editRecord.value
  editOpen.value = false;
};

const handleAddOk = () => {
  let key = harFiles.value[formState.file].log.entries.length + 1
  addRecord.value.key = key
  addRecord.value.response.key = key
  harFiles.value[formState.file].log.entries.push(addRecord.value)
  addOpen.value = false;
  addRecord.value = {}
};

const readClipboardText = async () => {
  try {
    // 请求剪切板读取权限
    const permission = await navigator.permissions.query({name: 'clipboard-read'});

    if (permission.state === 'granted' || permission.state === 'prompt') {
      // 读取文本内容
      let text = await navigator.clipboard.readText()
      if (text.length < 2) {
        message.error('add failed')
        return
      }
      try {
        addRecord.value = JSON.parse(text)
        handleAddOk()
        message.success('add success')

      } catch (e) {
        message.error('add failed')
      }
    } else {
      alert('please allow read！');
    }
  } catch (error) {
    console.error('读取失败:', error);
    alert('无法读取剪切板内容，请确保浏览器支持或已授予权限');
  }
};

const quickCopy = (record) => {
  copyText(JSON.stringify(record))
  message.success('copy success!')
}
</script>
<style>
.condition {
//border: 1px #d9d9d9 solid; border-radius: 10px; margin-top: 10px; padding: 1rem; background-color: rgba(255, 255, 255, 0.4); //width: 30%;
}

.radio {
  display: flex;
  gap: 1rem
}
</style>

