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
    '& .rc-cascader': {
      fontSize: 12,
    },
  },
  popup: {
    '&.rc-cascader-dropdown': {
      minHeight: '100px',
    },
    '&.rc-cascader-dropdown-hidden': {
      display: 'none',
    },
    '& .rc-cascader-menus': {
      zIndex: 1000,
      fontSize: 12,
      overflow: 'hidden',
      background: '#fff',
      position: 'absolute',
      border: '1px solid #d9d9d9',
      borderRadius: 6,
      whiteSpace: 'nowrap',
    },
    '& .rc-cascader-menu': {
      display: 'inline-block',
      width: 'auto',
      listStyle: 'none',
      margin: 0,
      padding: 0,
      borderRight: '1px solid #e9e9e9',
      overflow: 'auto',
      '&:last-child': {
        borderRight: 0,
      },
    },
    '& .rc-cascader-menu-item': {
      display: 'flex',
      width: 'auto',
      overflow: 'hidden',
      fontSize: '1rem',
      boxSizing: 'border-box',
      lineHeight: 1.5,
      paddingTop: '6px',
      whiteSpace: 'nowrap',
      paddingBottom: '6px',
      paddingLeft: '16px',
      paddingRight: '20px',
      '&:hover': {
        background: 'rgba(0, 0, 0, 0.04)',
      },
      '&.rc-cascader-menu-item-active': {
        background: 'rgba(0, 0, 0, 0.08)',
        '&:hover': {
          background: 'rgba(0, 0, 0, 0.08)',
        },
      },
      '&.rc-cascader-menu-item-expand': {
        position: 'relative',
      },
    },
    '& .rc-cascader-menu-item-expand-icon': {
      position: 'absolute',
      right: '4px',
      top: '50%',
      transform: 'translateY(-50%)',
    },
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
        dropdownClassName={classes.popup}
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
