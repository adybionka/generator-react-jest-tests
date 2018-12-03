import React from 'react';
import { shallow } from 'enzyme';
import <%- componentInfo.displayName %> from '<%-relativeFilePath%>';
<% if (testDataImports.length) { %><%-testDataImports.join(';\n')%><%- ';\n' %><% } %>
describe('<<%-componentInfo.displayName%> />', () => {
  it('renders correctly', () => {
    const node = (
      <<%- componentInfo.displayName%>
<%- componentProps.map(meta => {
    if (typeof meta.propDefaultValue === 'object') {
      return '        ' + meta.propName + '={' + meta.propDefaultValue[0] + '}'  ;
    }

    return "        " + meta.propName + ((meta.propType === 'string' && meta.propDefaultValue) ? ('=' + meta.propDefaultValue + '') : ("={" + meta.propDefaultValue + "}"));
}).join('\n') %><% if (hasChildren) { %>
      >
        <div>I am children</div>
      </<%- componentInfo.displayName%>><% } else { %>
      /><% } %>
    );
    const wrapper = shallow(node);

    expect(wrapper).toMatchSnapshot();
  });
});
