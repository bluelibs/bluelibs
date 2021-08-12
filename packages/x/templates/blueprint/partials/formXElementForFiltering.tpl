
{{!-- 

The differences between standard formXElements are:
- Dates, Numbers are transformed in range
- There is no such thing as a "list"
- Enums, Relationships are in "many" mode.

 --}}
{
  id: "{{ id }}",
  label: "{{ title }}",
  name: {{ dataIndexStr }},
  {{# if description }}
    tooltip: "{{ description }}",
  {{/ if }}
  {{!-- OBJECT HANDLING --}}
  {{# if (@root.typeIs rendererType "object") }}
    columns: true,
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
            mode="multiple"
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
    {{# if (@root.typeIs rendererType "objectId") }}
      render: (props) => (
        <Ant.Form.Item {...props}><Ant.Input /></Ant.Form.Item>
      ),
    {{/ if }}
    {{# if (@root.typeIs rendererType "number") }}
      render: (props) => (
        <Ant.Form.Item {...props}>
          <Ant.Slider
            range
            step={10}
            min={0}
            max={100000}
          />
        </Ant.Form.Item>
      ),
    {{/ if }}
    {{# if (@root.typeIs rendererType "date") }}
      render: (props) => (
        <Ant.Form.Item {...props}><Ant.DatePicker.RangePicker/></Ant.Form.Item>
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
  {{/ if }}
  {{!-- ENUM HANDLING --}}
  {{# if (@root.typeIs rendererType "enum") }}
    render: (props) => (
      <Ant.Form.Item {...props}>
        <Ant.Select
          mode="multiple"
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
