
{
  id: "{{ id }}",
  label: "{{ title }}",
  name: {{ dataIndexStr }},
  {{# if required }}
    required: true,
  {{/ if }}
  {{# if order }}
    order: {{ order }},
  {{/ if }}
  {{# if description }}
    tooltip: "{{ description }}",
  {{/ if }}
  {{!-- OBJECT HANDLING --}}
  {{# if (@root.typeIs rendererType "object") }}
    {{# if isMany }}
      isList: true,
    {{/ if }}
    nest: [
      {{# each subfields }}
        {{> formXElement }}
      {{/ each }}
    ],
  {{/ if }}
  {{!-- RELATION HANDLING --}}
  {{# if (@root.typeIs rendererType "relation") }}
    render: (props) => (
      <Ant.Form.Item {...props}>
        <UIComponents.RemoteSelect
            collectionClass={ {{ remoteCollectionClass }} }
            field="{{ remoteField }}"
            placeholder="Please select an option"
            {{# if isMany }}
              mode="multiple"
            {{/ if }}
         />
      </Ant.Form.Item>
    ),
  {{/ if }}
  {{# if (@root.typeIs rendererType "file") }}
    render: (props) => (
      <Ant.Form.Item {...props}>
        <UIComponents.AdminFileUpload
            field="{{ remoteField }}"
         />
      </Ant.Form.Item>
    ),
  {{/ if }}
  {{# if (@root.typeIs rendererType "files") }}
    render: (props) => (
      <Ant.Form.Item {...props}>
        <UIComponents.AdminFilesUpload
            field="{{ remoteField }}"
         />
      </Ant.Form.Item>
    ),
  {{/ if }}
  {{# if (@root.typeIs rendererType "fileGroup") }}
    render: (props) => (
      <Ant.Form.Item {...props}>
        <UIComponents.AdminFileGroupUpload
            field="{{ remoteField }}"
         />
      </Ant.Form.Item>
    ),
  {{/ if }}
  {{!-- PRIMITIVE HANDLING --}}
  {{# if (@root.typeIsFormPrimitive rendererType) }}
    {{# if (@root.typeIs rendererType "string") }}
      render: (props) => (
        <Ant.Form.Item {...props}><Ant.Input /></Ant.Form.Item>
      ),
    {{/ if }}
    {{# if (@root.typeIs rendererType "number") }}
      render: (props) => (
        <Ant.Form.Item {...props}><Ant.Input /></Ant.Form.Item>
      ),
    {{/ if }}
    {{# if (@root.typeIs rendererType "objectId") }}
      render: (props) => (
        <Ant.Form.Item {...props}><Ant.Input /></Ant.Form.Item>
      ),
    {{/ if }}
    {{# if (@root.typeIs rendererType "date") }}
      render: (props) => (
        <Ant.Form.Item {...props}><UIComponents.DatePicker /></Ant.Form.Item>
      ),
    {{/ if }}
    {{# if (@root.typeIs rendererType "boolean") }}
      render: (props) => (
        <Ant.Form.Item {...props}>
          <Ant.Radio.Group>
            <Ant.Radio value={false} key={0}>No</Ant.Radio>
            <Ant.Radio value={true} key={1}>Yes</Ant.Radio>
          </Ant.Radio.Group>
        </Ant.Form.Item>
      ),
    {{/ if }}
    {{# if isMany }}
      isList: true,
    {{/ if }}
  {{/ if }}
  {{!-- ENUM HANDLING --}}
  {{# if (@root.typeIs rendererType "enum") }}
    render: (props) => (
      <Ant.Form.Item {...props}>
        <Ant.Select
          {{# if isMany }}
            mode="multiple"
          {{/ if }}
          placeholder="Please select {{ title }}"
        >
          {{# each enumValues }}
            <Ant.Select.Option value="{{ value }}" key="{{ value }}">{{ label }}</Ant.Select.Option>
          {{/ each }}
        </Ant.Select>
      </Ant.Form.Item>
    ),
  {{/ if }}
},
