import React from 'react';
import JSBI from "jsbi";
import { Contract, Wavelet } from "wavelet-client";
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Form, Row, FormControl, InputGroup, Col, Button, Table } from 'react-bootstrap';


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      client: null,
      contract: null,
      wallet: null,
      isConnected: false,
      scores: [],
      voted: false,
      location: "",
      year: 0,
    }
  }
  render() {
    return (
      <div id="App">
        <div id="load_election_contract">
          <h2 className = "title">Load Election Contract</h2>
          <Form>
            <Form.Group as={Row} controlId="inputNode">
              <Form.Label column sm="2">
                [Node]
              </Form.Label>
              <Col sm="6">
                <Form.Control placeholder="Node" value="https://testnet.perlin.net" />
              </Col>
            </Form.Group>

            <Form.Group as={Row} controlId="inputSecret">
              <Form.Label column sm="2">
                [Secret]
              </Form.Label>
              <Col sm="6">
                <FormControl
                  placeholder="Secret"
                  disabled={this.state.isConnected}
                  value="cef64b3ef1f51e01c0833d11070e1ce5aa037aef3947f57346b419fa4c88af1a7a92d7b3169f598d6cb5acd7c352588ef89be4d0b33643e372a74dfb254cc8e2"
                />
              </Col>
              <Col>
                <Button variant="outline-secondary" onClick={() => this.handleConnect()} >
                  {this.state.isConnected ? "Disconnect" : "Connect"}
                </Button>
              </Col>
            </Form.Group>

            <Form.Group as={Row} controlId="inputContract">
              <Form.Label column sm="2">
                [Contract]
              </Form.Label>
              <Col sm="6">
                <FormControl
                  placeholder="Contract"
                  value="dedbbff51c2d6b43981a12ab2cff871fc20984f717402558c7abd1efbd06a7ae" />

              </Col>
              <Col>
                <Button variant="outline-secondary"
                  disabled={!this.state.isConnected}
                  onClick={() => this.handleContract()}
                >
                  Load Ballot Paper</Button>
              </Col>
            </Form.Group>
          </Form>

          <p>* You will login with your Secret</p>
          <p>* Load contract populates the Ballot paper with election information</p>
        </div>

        <div id="current_loading_results">
          <h2 className = "title" >CURRENT VOTING RESULTS</h2>
          <Table borderless>
            {this.state.scores.map((item) => <tr><td>{item.name}</td><td align="right">{item.points} points</td></tr>)}
          </Table>
          <p className = "notes"> * Election information is displayed once you load up the Contract.</p>
        </div>

        <div id="ballot_paper">
          <h2 className="title">BALLOT PAPER</h2>
          <h4 className="subtitle" underline>
            YEAR: {this.state.year} <br></br>
            LOCATION:{this.state.location}
          </h4>
          <ol id="votes">
            {this.state.scores.map((item) =>
              <li id={item.name} >
                <input type="number" min={0} max={5} defaultValue={0}>

                </input> {item.name}
              </li>
            )
            }
          </ol>
          <div className = "notes">
            {this.state.voted ? <p>- You have already voted</p> : <p></p>}
            <p>- Repeating candidate number is not allowed.</p>
            <p>- You can only vote once, multiple submit is not allowed.</p>
          </div>
          <Button variant="outline-secondary" id="vote_button" disabled={this.state.voted} onClick={() => this.handleVote()}>Submit Vote</Button>
        </div>
      </div>
    );
  }

  handleConnect() {
    this.setState((prev) => { return { isConnected: !prev.isConnected } });
  }



  async handleContract() {
    this.setState({ votes: {} });
    let node_address = document.getElementById("inputNode").value;
    let secret_key = document.getElementById("inputSecret").value;
    let contract_address = document.getElementById("inputContract").value;
    const client = new Wavelet(node_address);
    const wallet = Wavelet.loadWalletFromPrivateKey(secret_key);
    const contract = new Contract(client, contract_address);

    await contract.init();
    this.setState({ client: client, contract: contract, wallet: wallet });
    this.receive_scores();

    //this.setState(contract.test(wallet, 'scores', JSBI.BigInt(0)));
    let isVoted = this.state.contract.test(this.state.wallet, 'voted', JSBI.BigInt(0)).logs[0].toLowerCase() == "true";
    
    let year = this.state.contract.test(this.state.wallet, 'year', JSBI.BigInt(0)).logs[0];
    let location = this.state.contract.test(this.state.wallet, 'location', JSBI.BigInt(0)).logs[0];
    this.setState({ voted: isVoted,year:year,location:location });
    this.handleListening();
  }

  async handleListening() {
    await this.state.client.pollConsensus({
      onRoundEnded: msg => {
        (async () => {
          await this.state.contract.fetchAndPopulateMemoryPages();
          this.receive_scores()
        })();
      }
    });
  }

  receive_scores() {
    let score_list = this.state.contract.test(this.state.wallet, 'scores', JSBI.BigInt(0)).logs[0].split(';');
    score_list = score_list.map(x => JSON.parse(x));
    console.log(score_list);
    this.setState({ scores: score_list });
  }

  async handleVote() {
    let isVoted = this.state.contract.test(this.state.wallet, 'voted', JSBI.BigInt(0)).logs[0].toLowerCase() == "true";
    this.setState({ voted: isVoted });
    if (isVoted) {
      return;
    }
    let selections = document.getElementById("votes").children;
    let vote_result = "";
    for (var i = 0; i < selections.length; i++) {
      // let input = x.children[0];
      let name = selections[i].id;
      let input_value = selections[i].children[0].value;
      vote_result = vote_result + name + ":" + input_value.toString() + ";"
    }
    vote_result = vote_result.substring(0, vote_result.length - 1);
    console.log(JSON.stringify(vote_result));
    await this.state.contract.call(
      this.state.wallet,
      'vote',
      JSBI.BigInt(0), // amount to send
      JSBI.BigInt(250000), // gas limit
      JSBI.BigInt(0), // gas deposit (not explained)
      { type: "string", value: vote_result },
    );
  }
}

export default App;
