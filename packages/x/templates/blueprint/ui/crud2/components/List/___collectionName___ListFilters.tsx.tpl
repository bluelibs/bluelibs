import {
  {{# each collectionClassNamesOfInterest }}
    {{ this }},
  {{/ each }}
} from "@bundles/{{ bundleName }}/collections";
import * as Ant from "antd";
import * as React from "react";
import * as debounce from "lodash.debounce";
import { use, useTranslate } from "@bluelibs/x-ui";
import { {{ entityName }}ListFiltersForm } from "../../config/{{ entityName }}ListFiltersForm";

type {{ generateComponentName "listFilters" }}Props = {
  onUpdate: (filters: any) => void;
}

export const {{ generateComponentName "listFilters" }} = React.memo({{ generateComponentName "listFilters" }}Base);

export function {{ generateComponentName "listFilters" }}Base(props: {{ generateComponentName "listFilters" }}Props) {
  const [form] = Ant.Form.useForm();
  const t = useTranslate();

  const debouncedFilterUpdates = React.useMemo(() => {
    const setFilters = (_, filters) => {
      props.onUpdate(filters);
    };
    return debounce(setFilters, 500);
  }, [props.onUpdate]);

  const filterForm = use({{ entityName }}ListFiltersForm, { transient: true });
  filterForm.build();

  return (
    <Ant.Form 
      form={form}
      labelCol={ {span: 24} }
      onValuesChange={debouncedFilterUpdates}
    >
      <Ant.Row gutter={[16, 8]}>
        {
          filterForm.rest().map(item => {
            return <Ant.Col span={8} key={item.id}>{filterForm.render(item)}</Ant.Col>
          })
        }
      </Ant.Row>
      <Ant.Form.Item>
        <Ant.Button htmlType="button" onClick={() => {
          form.resetFields()
          props.onUpdate({})
        }}>
          {t('generics.list_filters_reset')}
        </Ant.Button>
      </Ant.Form.Item>
    </Ant.Form>
  );
}
