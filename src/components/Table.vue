<template>
  <a-upload style="display: flex;flex-direction: column; width: 400px;align-items: start;margin-top: 10px"
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
    <a-button>
      <upload-outlined></upload-outlined>
      上传har文件
    </a-button>
  </a-upload>

  <a-form-item label="文件" style="margin-top: 10px">
    <a-select style="width: 400px;max-width: 600px" :options="harFileOptions" v-model:value="formState.file"
              placeholder=""></a-select>
  </a-form-item>
  <a-form style="margin-top: 10px" layout="inline" :model="formState">

    <a-form-item label="url" style="max-width: 300px">
      <a-input v-model:value="formState.url" placeholder="搜索 url"/>
    </a-form-item>
    <a-form-item label="状态码">
      <a-select style="width: 100px" :options="statusOptions" v-model:value="formState.status"
                placeholder=""></a-select>
    </a-form-item>
    <a-form-item label="状态码说明">
      <a-select style="width: 200px" :options="statusTextOptions" v-model:value="formState.statusText"
                placeholder=""></a-select>
    </a-form-item>
  </a-form>

  <a-space direction="vertical" style="display: flex; margin: 10px">
    <a-space warp>
      <a-tooltip title="add">
        <a-button :disabled="Object.keys(harFiles.valueOf()).length===0" @click="addEntries">add record</a-button>
      </a-tooltip>
      <a-tooltip title="download">
        <a-button :disabled="Object.keys(harFiles.valueOf()).length===0" @click="downloadHAR">download har</a-button>
      </a-tooltip>
    </a-space>
  </a-space>

  <a-table :columns="columns" :data-source="filterTableData" :scroll="{ x: 1200 }"
           style="overflow: scroll;width: 100%;height: 80%;margin-top: 10px"
           :currentPage="currentPage">
    <template #bodyCell="{ column,record,idx }">
      <template v-if="column.key === 'operation'">
        <a>Publish</a>
      </template>
      <template v-else-if="column.dataIndex === 'operation'">
        <a-button @click="onDelete(record.key)">删除</a-button>
        <a-button @click="editShowModal(record)">编辑</a-button>
        <a-button @click="copyText(JSON.stringify(record))">复制</a-button>
      </template>
    </template>

    <template #expandedRowRender="{ record }">
      <!--      <a-collapse v-model:activeKey="activeKey" v-for="item of [-->
      <!--            {key:0,type:'request',data:record.request},-->
      <!--            {key:1,type:'response',data:record.response}-->
      <!--            ]">-->
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
import {UploadOutlined} from '@ant-design/icons-vue';
import type {UnwrapRef} from 'vue';
import {computed, reactive, ref, watch} from 'vue';
import type {UploadChangeParam} from 'ant-design-vue';
import {message, UploadProps} from 'ant-design-vue';
import JsonEditorVue from 'json-editor-vue'
import {destr} from "destr";
import {copyText} from 'vue3-clipboard'

const columns = [
  {
    title: '序号',
    key: 'idx',
    dataIndex: 'key',
    width: 80
  },
  {title: 'status', dataIndex: ['response', 'status'], key: 'status', width: 80},
  {title: 'method', dataIndex: ['request', 'method'], width: 90},
  {
    title: 'url', dataIndex: ['request', 'url'], key: 'url', width: 500, ellipsis: true,
    render: url => url.split('?')[0]
  },
  {title: 'statusText', dataIndex: ['response', 'statusText'], width: 200, key: 'statusText'},
  {title: 'bodySize', dataIndex: ['response', 'bodySize'], key: 'bodySize'},
  // {
  //   title: 'response', dataIndex: ['response',], width: 300, ellipsis: true,
  //   render: (response) => {
  //     return JSON.stringify(response)
  //   },
  // },
  {
    title: 'operation',
    dataIndex: 'operation',
    width: 120
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

            return true
          }
      )
    }
)

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
    if (fileList.value.filter(item => item.name === file.name).length > 0) {
      message.error(`${file.name} 文件已存在.`);
      return false;
    }
    console.log(file)
    const fileContent = e.target.result;
    // console.log('文件内容：', fileContent);
    let result = destr(String(fileContent))
    // 这里可以对 fileContent 进行进一步处理
    result.log.entries.map((item, index) => {
      item.key = index
      item.response.key = index
    })

    harFiles.value[info.file.name] = result

    let statusArr = [...new Set(result.log.entries.map(item => item.response.status))]
    statusOptions.value = statusArr.map(status => {
      return {label: String(status), value: status}
    })

    statusOptions.value.unshift({label: "全部", value: null})

    let statusTextArr = [...new Set(result.log.entries.map(item => item.response.statusText))]
    statusTextOptions.value = statusTextArr.map(status => {
      return {label: String(status), value: status}
    })
    statusTextOptions.value.unshift({label: "全部", value: ''})
    formState.file = info.file.name
  };

  // 读取出错时的回调
  reader.onerror = (err) => {
    message.error('读取文件失败');
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
const statusOptions = ref([])
const statusTextOptions = ref([])
const fileList = ref([]);
const headers = {
  authorization: 'authorization-text',
};

const beforeUpload: UploadProps['beforeUpload'] = file => {
  if (fileList.value.filter(item => item.name === file.name).length > 0) {
    message.error(`${file.name} 文件已存在.`);
    fileList.value = fileList.value.filter(item => item.name !== file.name);
  }
  return false;
};

interface FormState {
  file: string;
  url: string;
  status: number;
  statusText: string;
}

const formState: UnwrapRef<FormState> = reactive({
  file: '',
  url: '',
  status: null,
  statusText: null,
});

const removeHarFile = (file) => {
  console.log('删除文件', file.name)
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

const handleAddOk = (e: MouseEvent) => {
  console.log(editRecord.value);
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
      return await navigator.clipboard.readText()
    } else {
      alert('请允许剪切板访问权限！');
    }
  } catch (error) {
    console.error('读取失败:', error);
    alert('无法读取剪切板内容，请确保浏览器支持或已授予权限');
  }
};
</script>

