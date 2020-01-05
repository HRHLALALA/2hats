use smart_contract_macros::smart_contract;

use smart_contract::log;
use smart_contract::payload::Parameters;
use std::collections::VecDeque;
use std::collections::HashMap;

// #[warn(unused_imports)]
extern crate  json;

struct BallotPaper{

    scores:HashMap<String, i32>,
    users:VecDeque<[u8; 32]>,
    year:String,
    location:String


}

#[smart_contract]
impl BallotPaper {
    fn init(_params: &mut Parameters) -> Self {
        let mut scores = HashMap::new(); 
        scores.insert("AYIREBI, CECIL (LIBERAL)".to_string(), 0);
        scores.insert("BUTLER, DIONE (PEPUBLICAN)".to_string(), 0);
        scores.insert("GARSIDE, CHARLES (LABOUR)".to_string(), 0);
        scores.insert("KING, STUART (DEMOCRATIC)".to_string(), 0);
        scores.insert("WHITWELL, FRANK (GREEN)".to_string(), 0);
        Self {
            scores: scores,
            users: VecDeque::new(),
            year:"2020".to_string(),
            location:"NORTH HUDSON".to_string()
        }
        
    }

    fn scores(&mut self, _params: &mut Parameters) -> Result<(),String>{
        
        let mut vec_scores: Vec<String> = Vec::new();
        for (key,value) in self.scores.iter() {
            
            vec_scores.push(
                format!("{{\"name\":\"{}\",\"points\":{}}}", key, value)
            );

        }

        
        log(&vec_scores.join(";"));
        Ok(())
    }
    fn voted(&mut self,params: &mut Parameters)-> Result<(),String>{

        let uid: [u8; 32] = params.sender;
        if self.users.contains(&uid){
            log("true");
        }
        else{
            log("false");
        }
        Ok(())
    }

    fn vote(&mut self,params: &mut Parameters) -> Result<(),String>{
        let uid: [u8; 32] = params.sender;
        self.users.push_back(uid);
        let message : String = params.read();
        let members: Vec<&str> = message.split(";").collect();
        for member in members{
            let collections: Vec<&str> = member.split(":").collect();
            let key = collections[0];
            let value:i32 = collections[1].parse().unwrap();
            
            match self.scores.get(key){
                Some(v) => {
                    if value != 0{
                        self.scores.insert(key.to_string(),v + 6 - value);
                    }
                },
                None => {}
            }
        }
        
        let mut vec_scores: Vec<String> = Vec::new();
        for (key,value) in self.scores.iter() {
            
            vec_scores.push(
                format!("{{\"name\":\"{}\",\"points\":{}}}", key, value)
            );

        }

        
        log(&vec_scores.join(";"));
        Ok(())
    }
    
    fn year(&mut self,_params: &mut Parameters)-> Result<(),String>{
        log(self.year.as_mut_str());
        Ok(())
    }
    fn location(&mut self,_params: &mut Parameters)-> Result<(),String>{
        log(self.location.as_mut_str());
        Ok(())
    }
}