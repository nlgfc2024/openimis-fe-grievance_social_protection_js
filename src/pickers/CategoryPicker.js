import React, { useState } from 'react';
import Cascader from 'rc-cascader';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import { withTheme, withStyles } from '@material-ui/core/styles';
import { TextField } from '@material-ui/core';
import { useTranslations, useGraphqlQuery } from '@openimis/fe-core';

const styles = () => ({
  root: {
    width: '100%',
  },
});

function CategoryPicker(props) {
  const {
    onChange,
    readOnly,
    required,
    value,
    label,
    placeholder,
    classes,
    multiple,
  } = props;
  const { formatMessage } = useTranslations('ticket');
  const [inputValue, setInputValue] = useState(value ?? '');

  const { data, error } = useGraphqlQuery(
    `query CategoryPicker {
        grievanceConfig{
          grievanceCategoriesHierarchical{
            name fullName priority permissions defaultFlags 
            children {
              name fullName priority permissions defaultFlags
            }
          }
        }
    }`,
    { skip: true },
  );

  const options = data?.grievanceConfig?.grievanceCategoriesHierarchical.map((type) => ({
    label: type.name,
    value: type.fullName,
    children: type.children.map((child) => ({
      label: child.name,
      value: child.fullName,
    })) ?? [],
  })) ?? [];

  const handleCascaderChange = (values, selectedOptions) => {
    const selected = selectedOptions.pop();
    setInputValue(selected?.value || '');
    onChange?.(selected.value);
  };

  const defaultValue = () => {
    if (!value) {
      return [];
    }
    return value.split('|')
      .map((v, index, arr) => arr.slice(0, index + 1)
        .join('|'));
  };

  return (
    <div className={classes.root}>
      <Cascader
        defaultValue={defaultValue()}
        multiple={multiple}
        options={options}
        onChange={handleCascaderChange}
        changeOnSelect
        getPopupContainer={(trigger) => trigger.parentElement}
        disabled={readOnly}
        expandIcon={<KeyboardArrowRightIcon fontSize="small" />}
        loadingIcon={<AutorenewIcon fontSize="small" className="spin" />}
      >
        <TextField
          label={label || formatMessage('CategoryPicker.label')}
          placeholder={placeholder ?? formatMessage('CategoryPicker.placeholder')}
          required={required}
          value={inputValue}
          fullWidth
          disabled={readOnly}
          error={error}
          InputProps={{
            readOnly: true,
            endAdornment: (<ArrowDropDownIcon
              style={{ color: 'rgba(0, 0, 0, 0.54)' }}
            />),
          }}
        />
      </Cascader>
    </div>
  );
}

export default withStyles(styles)(withTheme(CategoryPicker));
