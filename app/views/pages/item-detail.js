import React from 'react/addons';
import _ from 'lodash';
import ItemActions from '../../actions/item-actions';
import ProductStore from '../../stores/product-store';
import {State,Link} from 'react-router';
import {MentionsInput, Mention} from '@sprintly/react-mentions';
import {Accordion, Panel} from 'react-bootstrap';
import helpers from '../components/helpers';
import Select from 'react-select';
import ItemCard from '../components/item-card';
import marked from 'marked';
import Gravatar from '../components/gravatar';
import Slick from 'react-slick';
import moment from 'moment';
import OwnerAvatar from '../components/item-card/owner';

const ITEM_CLOSE_MAP = {
  10: 'invalid',
  20: 'fixed',
  30: 'duplicate',
  40: 'incomplete',
  50: 'wont fix',
  60: 'works for me'
}

const SCORE_TO_SHIRT_SIZES = {
  0: '~',
  1: 'S',
  3: 'M',
  5: 'L',
  8: 'XL',
}

const STATUS_MAP = {
  5: 'someday',
  10: 'backlog',
  20: 'current',
  30: 'complete',
  40: 'accepted'
}

var ItemDetail = React.createClass({

  mixins: [State],

  getInitialState() {
    return {
      item: {},
      attachments: false
    };
  },

  renderDescription() {
    if (this.state.item.description) {
      return (
        <div
          className="well"
          dangerouslySetInnerHTML={{
            __html: marked(this.state.item.description, {sanitize: true})
          }}
        />
      );
    } else {
      return '';
    }
  },

  buildTags(item) {
    if (item && item.tags) {
      var tags = item.tags.split(',');

      if (tags.length) {
        var tagIcon = <li><span className="glyphicon glyphicon-tag"></span></li>
        var tags = _.map(tags, function(tag, i) {
          return (
            <li key={i}>{tag}</li>
          )
        })
        tags.unshift(tagIcon)

        return (
          <ul>
            {tags}
          </ul>
        )
      }
    }
  },

  buildTitle(item) {
    if (item.type === 'story') {
      var whoFirstWord = item.who.split(' ')[0];
      var whoPre = helpers.vowelSound(whoFirstWord) ? 'As an ' : 'As a ' ;

      return  [
        <span className="italicize">{whoPre}</span>,
        `${item.who}`,
        <span className="italicize"> I want </span>,
        `${item.what}`,
        <span className="italicize"> so that </span>,
        `${item.why}`
      ]
    } else {
      return item.title
    }
  },

  timeSinceNow(time) {
    return moment(time).fromNow();
  },

  createdByTimestamp(item) {
    if (item.created_at) {
      let timestamp = this.timeSinceNow(item.created_at);
      let creator = `${item.created_by.first_name} ${item.created_by.last_name}`;

      return `Created by ${creator} ${timestamp}`;
    }
  },

  itemStatus(item) {
    let status = helpers.itemStatusMap(item.status);

    return helpers.toTitleCase(status);
  },

  assigneeGravatar(item) {
    let assignee = item.assigned_to;

    if (!assignee || !assignee.email) {
      <span><OwnerAvatar person="placeholder" /></span>
    } else {
      return (
        <Gravatar email={assignee.email} size={36} />
      )
    }
  },

  itemSizeButton(item) {
    // TODO: let the user toggle state between t-shirt and fibonnaci sizes
    return (
      <button className="estimator__button story">{item.score}</button>
    )
  },

  ticketDetail() {
    let item = this.state.item;

    if (item) {
      let members = helpers.formatSelectMembers(this.props.members);
      let type = helpers.toTitleCase(item.type);
      let ticketId = `#${item.number}`
      let title = this.buildTitle(item);
      let tags = this.buildTags(item);
      let createdByTimestamp = this.createdByTimestamp(item);
      let itemStatus = this.itemStatus(item);
      let assigneeGravatar = this.assigneeGravatar(item);
      let itemSizeButton = this.itemSizeButton(item);

      return (
        <div className="col-md-12 section ticket__detail">
          <div className="col-md-9 info">
            <div className="col-md-1 no-gutter collapse-gutters">
              <div className="col-md-12 type">
                {type}
              </div>
              <div className="col-md-12 id">
                {ticketId}
              </div>
            </div>
            <div className="col-md-11">
              <div className="col-md-12 title">
                {title}
              </div>
              <div className="col-md-12 meta">
                <div className="col-md-6 tags no-gutter">
                  {tags}
                </div>
                <div className="col-md-6 timestamp">
                  {createdByTimestamp}
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 ticket-actions collapse-gutters">
            <div className="col-md-12 ticket-state">
              <div className="col-md-4">
                <div className="col-md-12 title">
                  Progress
                </div>
                <div className="col-md-12 value">
                  {itemStatus}
                </div>
              </div>
              <div className="col-md-4">
                <div className="col-md-12 title">
                  Owner
                </div>
                <div className="col-md-12 value">
                  {assigneeGravatar}
                </div>
              </div>
              <div className="col-md-4">
                <div className="col-md-12 title">
                  Size
                </div>
                <div className="col-md-12 value">
                  {itemSizeButton}
                </div>
              </div>
            </div>
            <div className="col-md-12 control">
              <Select placeholder={"Choose owner"}
                      name="form-field-name"
                      className="assign-dropdown"
                      disabled={false}
                      value={"Update to ticket owner"}
                      options={members}
                      onChange={this.setAssignedTo}
                      clearable={true} />
            </div>
          </div>
        </div>
      )
    }
  },

  setDescription(ev, value) {
    console.log('NEW DESCRIPTION: ', value)
    let item = _.cloneDeep(this.state.item);
    item.description = value;

    this.setState({item: item});

    _.debounce(this.updateItem, 500);
  },

  updateItem() {
    console.log('trigger action to update the item via a item action');
  },

  buildFollowers(item) {
    let followers;
    if (item.followers) {
      followers = _.map(item.followers, (follower, i) => {
        return (
          <div key={i} className="col-md-4">
            <li><Gravatar email={follower.email} size={36} /></li>
          </div>
        )
      })
    } else {
      followers = (
        <div className="no-followers">No followers of this item yet</div>
      )
    }

    return (
      <ul>
        {followers}
      </ul>
    )
  },

  followItem() {
    console.log('Follow the item');
  },

  ticketDescription() {
    let item = this.state.item;
    let mentions = helpers.formatMentionMembers(this.props.members);
    let followers = this.buildFollowers(item);

    return (
      <div className="col-md-12 section">
        <div className="col-md-9">
          {this.header('description')}
          <MentionsInput
            value={item.description}
            onChange={this.setDescription}
            placeholder="Add a description...">
              <Mention data={mentions} />
          </MentionsInput>
        </div>
        <div className="col-md-3 followers">
          {this.header('followers')}
          {followers}
          <button className="detail-button kanban-button-secondary" onClick={this.followItem}>Follow</button>
        </div>
      </div>
    )
  },

  toggleAttachments() {
    this.setState({attachments: !this.state.attachments});
  },

  showAttachment() {
    console.log('Implement attachment viewer: ');
  },

  attachmentsViewer() {
    var attachments = _.chain(_.times(4))
                            .map((i) => {
                              var styles = {
                                width: '33%',
                                height: '170px',
                                'background-color': `RGBA(69, 69, 69, ${1-(0.15*(i+1))})`,
                              }

                              return (
                                <div className="attachment-slide" key={i} style={styles} onClick={this.showAttachment}></div>
                              );
                            }).value();

    var settings = {
      dots: true,
      infinite: true,
      slidesToShow: 3,
      speed: 500,
      slidesToScroll: 1,
      responsive: [
        {
          breakpoint: 1024,
          settings: {
            slidesToShow: 3,
            slidesToScroll: 3,
            infinite: true,
            dots: false
          }
        },
        {
          breakpoint: 600,
          settings: {
            slidesToShow: 2,
            slidesToScroll: 2
          }
        },
        {
          breakpoint: 480,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1
          }
        }
      ]
    };

    return (
      <Slick {...settings}>
        {attachments}
      </Slick>
    );
  },

  openAttachments(ev, value) {
    ev.preventDefault();
    console.log('openAttachments: ', value);
  },

  attachments() {
    var contentClasses = React.addons.classSet({
      'content': true,
      'open': this.state.attachments
    })

    var attachmentLinks = _.chain(_.times(10))
                          .map(function(i) {
                            return (
                              <li>
                                <a className="attachment-link">{`customer-req-doc-${i}`}</a>
                              </li>
                            )
                          }).value();

    return (
      <div className="col-md-12 section attachments">
        <div className="col-md-12">
          <div className="header">
            <a className="toggle" onClick={this.toggleAttachments}>
              <span aria-hidden="true" className="glyphicon glyphicon-menu-right"/>
            </a>
            <div className="sep-vertical"></div>
            <div className="title">Attachments</div>
          </div>
          <div className={contentClasses}>
            <div className="col-md-12">
              <div className="col-md-9">
                <div className="title">
                  Attachments: #TBD
                </div>
                <div className="attachments-viewer">
                  {this.attachmentsViewer()}
                </div>
              </div>
              <div className="col-md-3">
                <div className="title">
                  Links: {attachmentLinks.length}
                </div>
                <div className="sep"></div>
                <ul className="links">
                  {attachmentLinks}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },

  createSubItem() {
    console.log('create the sub item');
  },

  toggleSubItem(index, ev) {
    var subitems = _.clone(this.state.subitems);

    subitems[index] = !this.state.subitems[index];

    this.setState({subitems: subitems})
  },

  viewFullTicket(ticketID) {
    console.log('Show full ticket with number: ', ticketID);
  },

  updateSubItem(subitem, ev) {
    var status;
    if (_.contains(['someday', 'backlog', 'in-progress'], subitem.status)) {
      status = 'accepted';
    } else if (_.contains(['completed', 'accepted'], subitem.status)) {
      status = 'in-progress';
    }

    ProductActions.updateItem(
      subitem.product.id,
      subitem.number,
      _.assign({}, subitem, { status }),
      { wait: false }
    );
  },

  subItems() {
    // var mockItems = [
    //   {
    //     id: '1234',
    //     title: 'Swap radio buttons for checkboxes',
    //     status: 'current',
    //     assignee: 'srogers@quickleft.com',
    //     score: '2',
    //     description: "Swap out existing radio buttons for a React component.\nhttp://react-components.com/component/react-radio-group\nEnsure selections are bubbled up through the flux arch and represented in the view state"
    //   },
    //   {
    //     id: '1234',
    //     title: 'Swap radio buttons for checkboxes',
    //     status: 'current',
    //     assignee: 'srogers@quickleft.com',
    //     score: '2',
    //     description: "Swap out existing radio buttons for a React component.\nhttp://react-components.com/component/react-radio-group\nEnsure selections are bubbled up through the flux arch and represented in the view state"
    //   },
    //   {
    //     id: '1234',
    //     title: 'Swap radio buttons for checkboxes',
    //     status: 'current',
    //     assignee: 'srogers@quickleft.com',
    //     score: '2',
    //     description: "Swap out existing radio buttons for a React component.\nhttp://react-components.com/component/react-radio-group\nEnsure selections are bubbled up through the flux arch and represented in the view state"
    //   }
    // ]

    let item = this.state.item;

    var subItems = _.map(item.sub_items, (subitem, i) => {
      var contentClasses = React.addons.classSet({
        'content': true,
        'open': this.state.subitems[i]
      })

      var title = subitem.title;
      var status = this.itemStatus(subitem);
      var itemID = subitem.number;
      var assigneeGravatar = this.assigneeGravatar(subitem);
      var itemSizeButton = this.itemSizeButton(subitem);
      // var description = this.ticketDescription(subitem);
      var description = subitem.description;
      var tags = this.buildTags(subitem);
      var createdByTimestamp = this.createdByTimestamp(subitem);
      let checked = subitem.status === 'completed' || subitem.status === 'accepted';

      return (
        <div key={i} className="subitem">
          <div className="header">
            <a className="toggle" onClick={_.partial(this.toggleSubItem, i)}>
              <span aria-hidden="true" className="glyphicon glyphicon-menu-right" />
            </a>
            <div className="sep-vertical"></div>
            <div className="title">{title}</div>
            <div className="col-md-4 state collapse-right">
              <ul>
                <li><div className="meta status">{status}</div></li>
                <li><div className="meta id">#{itemID}</div></li>
                <li><div className="meta">{assigneeGravatar}</div></li>
                <li><div className="meta">{itemSizeButton}</div></li>
                <li>
                  <div className="meta">
                    <div className="subitemCheck">
                    	<input type="checkbox" checked={checked} onChange={_.partial(this.updateSubItem, subitem)} id="subitemCheck" />
                      <label for="subitemCheck"></label>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <div className={contentClasses}>
            <div className="col-md-12">
              <div className="col-md-12 collapse-right">
                <div className="col-md-9 description">
                  {description}
                </div>
                <div className="col-md-3 collapse-right">
                  <button className="detail-button kanban-button-secondary" onClick={this.viewFullTicket(itemID)}>View Full Ticket</button>
                </div>
              </div>
              <div className="col-md-12 meta collapse-right">
                <div className="col-md-6 tags no-gutter">
                  {tags}
                </div>
                <div className="col-md-6 timestamp no-gutter">
                  {createdByTimestamp}
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    });

    return (
      <div className="col-md-12 section subitems">
        <div className="col-md-12">
          <div className="header">
            <div className="title">{helpers.toTitleCase('sub-items')}</div>
            <a className="collapse__subitems"onClick={this.collapseSubitems}>collapse all</a>
            <div className="sep"></div>
          </div>
        </div>
        <div className="col-md-12">
          {subItems}
        </div>
        <div className="col-md-12 add-subitem">
          <form className="item-card__add-subitem" onSubmit={this.createSubItem}>
            <input ref="addItemInput" type="text" placeholder={"Add new sub-task"} className="form-control" />
            <button className="btn btn-default">+</button>
          </form>
        </div>
      </div>
    )
  },

  collapseSubitems() {
    var subitemsLength = this.state.item.sub_items;
    var closedState = _.map(new Array(subitemsLength), () => { return false});
    this.setState({subitems: closedState});
  },

  header(title) {
    var titleCased = helpers.toTitleCase(title);

    return (
      <div className="header">
        <div className="title">{titleCased}</div>
        <div className="sep"></div>
      </div>
    )
  },

  comments() {
    let placeholder = "Use '@' to mention another Sprintly user.  Use #[item number] (e.g. #1234) to reference another Sprintly item.";

    return (
      <div className="col-md-12 section comments">
        <div className="col-md-12">
          {this.header('comment')}
          <div contentEditable></div>
          <div className="instructions">
            <div className="upload">Drag and drop or click here to attach files</div>
            <div className="syntax">Use Markdown & Emoji</div>
          </div>
          <div className="col-md-3 collapse-right pull-right">
            <button className="detail-button kanban-button-secondary">Comment</button>
          </div>
        </div>
      </div>
    )
  },

  fieldToValueMap(meta) {
    let oldVal;
    let newVal;

    switch (meta.field) {
      case 'score':
        oldVal = SCORE_TO_SHIRT_SIZES[meta.old];
        newVal = SCORE_TO_SHIRT_SIZES[meta.new];

        break;
      case 'status':
        oldVal = STATUS_MAP[meta.old];
        newVal = STATUS_MAP[meta.new];

        break;
      default:
        oldVal = meta.old;
        newVal = meta.new;
        break;
    }

    return {
      oldVal,
      newVal
    }
  },

  itemChanged(meta) {
    let valueMap = this.fieldToValueMap(meta)
    let field = helpers.toTitleCase(meta.field);
    return `the ${field} from ${valueMap.oldVal} to ${valueMap.newVal}`;
  },

  itemReassigned(meta) {
    let from;
    let to = `to ${this.abbreviatedName(meta.new)}`

    if (meta.old) {
      from = `from ${this.abbreviatedName(meta.old)}`
    }

    return [from, to].join(' ');
  },

  attachmentDescription(meta) {
    var pre = helpers.vowelSound(meta.type) ? 'An ' : 'A ';
    let type = helpers.toTitleCase(meta.type);

    return `${pre} ${type}: ${meta.title}`;
  },

  activityDescription(model) {
    let meta = model.meta;
    let description;

    switch (model.action) {
      case 'item created':
        description = ''
        break;
      case 'item changed':
        description = this.itemChanged(meta);
        break;
      case 'attachment':
        description = this.attachmentDescription(meta);
        break;
      case 'assigned':
        description = this.itemReassigned(meta);
        break;
      default:
        // This is a hack based on the api not returning an action for a comment
        if (model.cls === "Comment") {
          description = model.body
        } else {
          description = `DESCRIPTION CASE NOT HANDLED: cls:${model.cls}, label:${model.label}`
        }
    }

    return description;
  },

  activityTypeMap(action) {
    const ACTIVITY_TYPES = {
      'item created': 'created this',
      'item changed': 'updated',
      'attachment': 'attached',
      'assigned': 'reassigned',
      '': 'commented'
    }

    return ACTIVITY_TYPES[action] || `WARN: ${action} ACTIVITY`;
  },

  abbreviatedName(model) {
    if (!model) {
      return '';
    } else {
      return `${model.first_name} ${model.last_name.charAt(0)}.`
    }
  },

  activity() {
    let activityItems;
    let activity = this.state.item.activity;

    if (activity) {
      let totalActivityCount = activity.total_count || 0;

      if (activity.activities && this.props.members.length) {

        activityItems = _.map(activity.activities, _.bind(function(model) {
          let creator = _.findWhere(this.props.members, {id: model.user});
          let creatorEmail = creator.email;
          let creatorName = this.abbreviatedName(creator);
          let activityType = this.activityTypeMap(model.action);
          let description = this.activityDescription(model);
          let timestamp = this.timeSinceNow(model.created);

          return (
            <li className="comment">
              <div className="avatar no-gutter">
                <Gravatar email={creatorEmail} size={30} />
              </div>
              <div className="col-md-2 creator no-wrap-truncate">{creatorName}</div>
              <div className="col-md-1 activity-type no-gutter">{activityType}</div>
              <div className="col-md-7 description collapse-right">
                {description}
              </div>
              <div className="timestamp pull-right">
                {timestamp}
              </div>
            </li>
          )
        },this))
      } else {
        activityItems = <li className="comment">No Activity Yet</li>
      }

      return (
        <div className="col-md-12 section activity">
          <div className="col-md-12">
            <div className="header">
              <div className="title">{helpers.toTitleCase('activity')}</div>
              <div className="activity__counter">{totalActivityCount} items</div>
              <div className="sep"></div>
            </div>
            <ul>
              {activityItems}
            </ul>
          </div>
        </div>
      )
    }
  },

  // Display some sort of loading state via the item store
  componentDidMount() {
    ProductStore.addChangeListener(this._onChange);
    ItemActions.fetchItem(this.getParams().id, this.getParams().number);
    // TODO: Fetch the item followers on component did mount

    ItemActions.fetchActivity(this.getParams().id, this.getParams().number);
  },

  componentWillUnmount() {
    ProductStore.removeChangeListener(this._onChange);
  },

  componentWillReceiveProps: function(nextProps) {
    if (this.getParams().number != this.state.item.number) {
      this._onChange();
      // ItemActions.fetchItem(this.getParams().id, this.props.number);
    }
  },

  render() {
    if (!this.state.item.number) {
      // Update to loading state where correct
      return <div/>;
    }

    return (
      <div className="container-fluid item-detail no-gutter">
        <div className="stripe">
          <Link to="product" params={{ id: this.getParams().id }} className="item-detail__close">
            <span aria-hidden="true" className="glyphicon glyphicon-menu-right"/>
          </Link>
          <div className={"story"}>
          </div>
        </div>
        <div className="content">
            {this.ticketDetail()}
            {this.ticketDescription()}
            {this.attachments()}
            {this.subItems()}
            {this.comments()}
            {this.activity()}
        </div>
      </div>
    )
  },

  _onChange() {
    let item = ProductStore.getItem(this.getParams().id, this.getParams().number);
    console.log('ITEM UPDATED');

    if (item) {
      let subitemsState = {};
      let subitemsLength = item.sub_items.length;

      if (!this.state.subitems && subitemsLength) {
        var subitemState = _.map(new Array(subitemsLength), () => { return false});
        subitemsState['subitems'] = subitemState
      }

      this.setState(_.extend({item}, subitemsState));
    }
  }
});

export default ItemDetail;